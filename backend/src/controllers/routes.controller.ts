import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateRoute } from "../services/curriculum/curriculumService.js";
import { getOrGenerateNodeDocument } from "../services/curriculum/documentService.js";
import { getOrGenerateChallenge, gradeSubmission } from "../services/challenges/challengeService.js";
import { routeRepository } from "../repositories/index.js";
import { computeGlobalProgress, computeNodeStatuses } from "../models/route.js";
import type { Challenge } from "../schemas/challenge.schema.js";
import { notFound } from "../lib/httpError.js";

export const GenerateRouteBodySchema = z.object({
  topic: z.string().min(2, "El tema es muy corto").max(200),
  targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const SubmitChallengeBodySchema = z.object({
  quizOptionIndex: z.number().int().optional(),
  flashcardAnswer: z.string().optional(),
  codeSubmission: z.string().optional(),
  openResponseText: z.string().optional(),
});

/**
 * POST /api/routes
 * Orquesta: IA (structured outputs) genera la malla -> YouTube Data API v3
 * puebla el mejor video por nodo -> se persiste la ruta consolidada.
 * Documento y reto por nodo se generan aparte, on-demand (ver documentService
 * y challengeService) para no gastar presupuesto de IA en nodos sin abrir.
 */
export async function postGenerateRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic, targetLevel } = req.body as z.infer<typeof GenerateRouteBodySchema>;
    const route = await generateRoute({ topic, targetLevel });
    const progress = await routeRepository.getProgress(route.id);
    res.status(201).json(toRouteView(route, progress.completedNodeIds));
  } catch (err) {
    next(err);
  }
}

export async function getRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const route = await routeRepository.getRoute(req.params.routeId as string);
    if (!route) throw notFound(`Route ${req.params.routeId} no existe`);
    const progress = await routeRepository.getProgress(route.id);
    res.json(toRouteView(route, progress.completedNodeIds));
  } catch (err) {
    next(err);
  }
}

export async function getNodeDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const document = await getOrGenerateNodeDocument(req.params.routeId as string, req.params.nodeId as string);
    res.json(document);
  } catch (err) {
    next(err);
  }
}

export async function getNodeChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await getOrGenerateChallenge(req.params.routeId as string, req.params.nodeId as string);
    res.json(toPublicChallenge(challenge));
  } catch (err) {
    next(err);
  }
}

export async function postSubmitChallenge(req: Request, res: Response, next: NextFunction) {
  try {
    const routeId = req.params.routeId as string;
    const nodeId = req.params.nodeId as string;
    const submission = req.body as z.infer<typeof SubmitChallengeBodySchema>;

    const grade = await gradeSubmission(routeId, nodeId, submission);

    const progress = grade.passed
      ? await routeRepository.markNodeCompleted(routeId, nodeId)
      : await routeRepository.getProgress(routeId);

    const route = await routeRepository.getRoute(routeId);
    if (!route) throw notFound(`Route ${routeId} no existe`);

    res.json({
      grade,
      progress: {
        completedNodeIds: progress.completedNodeIds,
        percent: computeGlobalProgress(route.curriculum.nodes, progress.completedNodeIds),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const routeId = req.params.routeId as string;
    const route = await routeRepository.getRoute(routeId);
    if (!route) throw notFound(`Route ${routeId} no existe`);
    const progress = await routeRepository.getProgress(routeId);
    res.json({
      completedNodeIds: progress.completedNodeIds,
      percent: computeGlobalProgress(route.curriculum.nodes, progress.completedNodeIds),
    });
  } catch (err) {
    next(err);
  }
}

// --- helpers de shape de respuesta ---

function toRouteView(route: Awaited<ReturnType<typeof generateRoute>>, completedNodeIds: string[]) {
  const statuses = computeNodeStatuses(route.curriculum.nodes, completedNodeIds);
  return {
    id: route.id,
    topic: route.curriculum.topic,
    title: route.curriculum.title,
    description: route.curriculum.description,
    nodes: route.curriculum.nodes.map((node) => ({
      ...node,
      status: statuses[node.id],
      video: route.videosByNodeId[node.id] ?? null,
    })),
    progress: {
      completedNodeIds,
      percent: computeGlobalProgress(route.curriculum.nodes, completedNodeIds),
    },
  };
}

// No se expone la respuesta correcta al cliente antes de calificar
// (correctOptionIndex, acceptedAnswers, testCode) — se filtra acá.
function toPublicChallenge(challenge: Challenge) {
  switch (challenge.kind) {
    case "quiz": {
      const { correctOptionIndex: _correctOptionIndex, explanation: _explanation, ...rest } = challenge;
      return rest;
    }
    case "flashcard": {
      const { acceptedAnswers: _acceptedAnswers, ...rest } = challenge;
      return rest;
    }
    case "code": {
      const { testCode: _testCode, ...rest } = challenge;
      return rest;
    }
    case "open_response":
      return challenge;
  }
}
