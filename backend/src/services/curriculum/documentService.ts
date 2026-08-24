import { getLLMProvider } from "../llm/index.js";
import { fetchTranscript } from "../transcript/transcriptService.js";
import { searchRelatedSources } from "../search/tavilySearchService.js";
import { routeRepository } from "../../repositories/index.js";
import { NotFoundError } from "../../repositories/routeRepository.js";
import type { NodeDocument } from "../llm/types.js";

/** Genera (o devuelve cacheado) el documento complementario de un nodo, on-demand. */
export async function getOrGenerateNodeDocument(routeId: string, nodeId: string): Promise<NodeDocument> {
  const route = await routeRepository.getRoute(routeId);
  if (!route) throw new NotFoundError(`Route ${routeId} no existe`);

  const cached = route.documentsByNodeId[nodeId];
  if (cached) return cached;

  const node = route.curriculum.nodes.find((n) => n.id === nodeId);
  if (!node) throw new NotFoundError(`Nodo ${nodeId} no existe en la ruta ${routeId}`);

  const video = route.videosByNodeId[nodeId];
  // Transcripción y búsqueda web son independientes entre sí -- en paralelo.
  const [transcript, relatedSources] = await Promise.all([
    video ? fetchTranscript(video.videoId, route.locale) : Promise.resolve(null),
    // Reusa la searchQuery que la IA ya optimizó para este subtema (la misma
    // que usa YouTube), en vez de armar otra query nueva desde cero.
    searchRelatedSources(node.searchQuery),
  ]);

  const document = await getLLMProvider().generateNodeDocument({
    nodeTitle: node.title,
    nodeSummary: node.summary,
    locale: route.locale,
    videoTranscript: transcript,
    relatedSources,
  });

  await routeRepository.saveNodeDocument(routeId, nodeId, document);
  return document;
}
