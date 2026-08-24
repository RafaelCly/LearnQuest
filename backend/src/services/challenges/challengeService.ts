import { getLLMProvider } from "../llm/index.js";
import { fetchTranscript } from "../transcript/transcriptService.js";
import { routeRepository } from "../../repositories/index.js";
import { NotFoundError } from "../../repositories/routeRepository.js";
import { PASS_THRESHOLD } from "../../schemas/challenge.schema.js";
import { runJavaScriptInSandbox } from "../sandbox/jsSandbox.js";
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
  /** Índice de opción elegido por cada pregunta del quiz, en el mismo orden que `items`. */
  quizAnswers?: number[];
  /** Respuesta escrita por el usuario para cada flashcard, en el mismo orden que `items`. */
  flashcardAnswers?: string[];
  codeSubmission?: string;
  openResponseText?: string;
}

export interface ItemResult {
  correct: boolean;
  explanationOrExpected: string;
}

export interface GradeResultDetailed extends GradeResult {
  itemResults?: ItemResult[];
}

/**
 * Cada tipo de reto se califica con la estrategia MÁS barata que sea confiable
 * (ver one-pager de la idea): quiz/flashcard se comparan directo, sin gastar
 * una sola llamada de IA. El nodo se completa si el usuario acierta al menos
 * PASS_THRESHOLD del total de preguntas, no con una sola de suerte.
 */
export async function gradeSubmission(
  routeId: string,
  nodeId: string,
  submission: SubmissionInput
): Promise<GradeResultDetailed> {
  const challenge = await getOrGenerateChallenge(routeId, nodeId);

  switch (challenge.kind) {
    case "quiz": {
      const answers = submission.quizAnswers ?? [];
      const itemResults: ItemResult[] = challenge.items.map((item, i) => ({
        correct: answers[i] === item.correctOptionIndex,
        explanationOrExpected: item.explanation,
      }));
      return summarize(itemResults, "quiz");
    }

    case "flashcard": {
      const answers = submission.flashcardAnswers ?? [];
      const itemResults: ItemResult[] = challenge.items.map((item, i) => {
        const normalized = (answers[i] ?? "").trim().toLowerCase();
        const correct = item.acceptedAnswers.some((a) => a.trim().toLowerCase() === normalized);
        return { correct, explanationOrExpected: item.acceptedAnswers[0] ?? "" };
      });
      return summarize(itemResults, "flashcard");
    }

    case "code": {
      if (challenge.language.trim().toLowerCase() !== "javascript") {
        // El sandbox actual (node:vm) solo puede correr JS de forma segura.
        // No fallamos silenciosamente: se lo decimos al usuario tal cual.
        return {
          passed: false,
          score: 0,
          feedback: `Por ahora solo se puede ejecutar y calificar código JavaScript (este reto pidió "${challenge.language}"). Soporte multi-lenguaje pendiente.`,
        };
      }
      const result = runJavaScriptInSandbox(submission.codeSubmission ?? "", challenge.testCode);
      return {
        passed: result.passed,
        score: result.passed ? 100 : 0,
        feedback: result.passed
          ? "¡Todas las pruebas pasaron!"
          : `No pasó: ${result.error ?? "error desconocido al ejecutar tu código"}`,
      };
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

function summarize(itemResults: ItemResult[], kind: "quiz" | "flashcard"): GradeResultDetailed {
  const correctCount = itemResults.filter((r) => r.correct).length;
  const score = Math.round((correctCount / itemResults.length) * 100);
  const passed = correctCount / itemResults.length >= PASS_THRESHOLD;
  const feedback = passed
    ? `¡Bien! Acertaste ${correctCount} de ${itemResults.length}.`
    : `Acertaste ${correctCount} de ${itemResults.length} — necesitas al menos ${Math.ceil(itemResults.length * PASS_THRESHOLD)} para completar el nodo. Revisa las que fallaste e inténtalo de nuevo.`;
  return { passed, score, feedback, itemResults };
}
