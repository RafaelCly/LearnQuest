import { getLLMProvider } from "../llm/index.js";
import { fetchTranscript } from "../transcript/transcriptService.js";
import { routeRepository } from "../../repositories/index.js";
import { NotFoundError } from "../../repositories/routeRepository.js";
import type { Challenge } from "../../schemas/challenge.schema.js";
import type { GradeResult } from "../llm/types.js";

export async function getOrGenerateChallenge(routeId: string, nodeId: string): Promise<Challenge> {
  const route = await routeRepository.getRoute(routeId);
  if (!route) throw new NotFoundError(`Route ${routeId} no existe`);

  const cached = route.challengesByNodeId[nodeId];
  if (cached) return cached;

  const node = route.curriculum.nodes.find((n) => n.id === nodeId);
  if (!node) throw new NotFoundError(`Nodo ${nodeId} no existe en la ruta ${routeId}`);

  const video = route.videosByNodeId[nodeId];
  const transcript = video ? await fetchTranscript(video.videoId) : null;

  const challenge = await getLLMProvider().generateChallenge({
    nodeTitle: node.title,
    nodeSummary: node.summary,
    contentType: node.contentType,
    videoTranscript: transcript,
  });

  await routeRepository.saveNodeChallenge(routeId, nodeId, challenge);
  return challenge;
}

export interface SubmissionInput {
  quizOptionIndex?: number;
  flashcardAnswer?: string;
  codeSubmission?: string;
  openResponseText?: string;
}

/**
 * Cada tipo de reto se califica con la estrategia MÁS barata que sea confiable
 * (ver one-pager de la idea): quiz/flashcard se comparan directo, sin gastar
 * una sola llamada de IA. Código y respuesta abierta sí la necesitan.
 */
export async function gradeSubmission(
  routeId: string,
  nodeId: string,
  submission: SubmissionInput
): Promise<GradeResult> {
  const challenge = await getOrGenerateChallenge(routeId, nodeId);

  switch (challenge.kind) {
    case "quiz": {
      const passed = submission.quizOptionIndex === challenge.correctOptionIndex;
      return { passed, score: passed ? 100 : 0, feedback: challenge.explanation };
    }

    case "flashcard": {
      const normalized = (submission.flashcardAnswer ?? "").trim().toLowerCase();
      const passed = challenge.acceptedAnswers.some((a) => a.trim().toLowerCase() === normalized);
      return {
        passed,
        score: passed ? 100 : 0,
        feedback: passed ? "¡Correcto!" : `Respuesta esperada: ${challenge.acceptedAnswers[0]}`,
      };
    }

    case "code": {
      // TODO: ejecutar challenge.testCode contra submission.codeSubmission en un
      // sandbox aislado (ej. Vercel Sandbox / contenedor descartable). No se
      // ejecuta código de usuario sin sandbox por seguridad — placeholder explícito
      // en vez de un "false pass" silencioso.
      throw new Error("Ejecución de código en sandbox todavía no implementada");
    }

    case "open_response": {
      // Fuera del alcance del MVP (ver "No haremos" del one-pager) — queda
      // cableado para cuando se aborde el tipo creativo/subjetivo.
      return getLLMProvider().gradeOpenResponse({
        prompt: challenge.prompt,
        rubric: challenge.rubric,
        userResponse: submission.openResponseText ?? "",
      });
    }
  }
}
