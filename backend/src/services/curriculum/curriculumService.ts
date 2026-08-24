import { randomUUID } from "node:crypto";
import { getLLMProvider } from "../llm/index.js";
import { findBestVideoForNode, type VideoResult } from "../youtube/youtubeService.js";
import { routeRepository } from "../../repositories/index.js";
import type { Route } from "../../models/route.js";
import type { CurriculumNode } from "../../schemas/curriculum.schema.js";
import { DEFAULT_LOCALE, type LocaleCode } from "../../schemas/locale.js";

export interface GenerateRouteParams {
  topic: string;
  locale?: LocaleCode;
  targetLevel?: "beginner" | "intermediate" | "advanced";
}

/**
 * Orquesta: IA genera la malla -> por cada nodo se busca el mejor video en
 * YouTube. A propósito NO genera documento ni reto acá — esos se generan
 * on-demand cuando el usuario abre un nodo (services/challenges,
 * services/curriculum/documentService), para no gastar presupuesto de IA en
 * nodos que el usuario nunca llega a abrir.
 */
export async function generateRoute({ topic, locale = DEFAULT_LOCALE, targetLevel }: GenerateRouteParams): Promise<Route> {
  const llm = getLLMProvider();
  const curriculum = await llm.generateCurriculum({ topic, locale, targetLevel });

  const videosByNodeId = await fetchVideosWithConcurrencyLimit(curriculum.nodes, locale, 3);

  const route: Route = {
    id: randomUUID(),
    locale,
    curriculum,
    videosByNodeId,
    documentsByNodeId: {},
    challengesByNodeId: {},
    createdAt: new Date().toISOString(),
  };

  await routeRepository.createRoute(route);
  return route;
}

async function fetchVideosWithConcurrencyLimit(
  nodes: CurriculumNode[],
  locale: LocaleCode,
  concurrency: number
): Promise<Record<string, VideoResult | null>> {
  const results: Record<string, VideoResult | null> = {};
  const queue = [...nodes];

  async function worker() {
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) return;
      try {
        results[node.id] = await findBestVideoForNode(node.searchQuery, locale);
      } catch (err) {
        // Un video que falla no debe tumbar la ruta entera; el nodo queda
        // sin video y el frontend lo muestra como "sin video disponible".
        console.error(`No se pudo obtener video para nodo ${node.id}:`, err);
        results[node.id] = null;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
