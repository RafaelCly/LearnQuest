import { getLLMProvider } from "../llm/index.js";
import { fetchTranscript } from "../transcript/transcriptService.js";
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
  const transcript = video ? await fetchTranscript(video.videoId, route.locale) : null;

  const document = await getLLMProvider().generateNodeDocument({
    nodeTitle: node.title,
    nodeSummary: node.summary,
    locale: route.locale,
    videoTranscript: transcript,
  });

  await routeRepository.saveNodeDocument(routeId, nodeId, document);
  return document;
}
