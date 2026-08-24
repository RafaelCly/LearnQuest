import type { Curriculum, CurriculumNode } from "../schemas/curriculum.schema.js";
import type { Challenge } from "../schemas/challenge.schema.js";
import type { VideoResult } from "../services/youtube/youtubeService.js";
import type { NodeDocument } from "../services/llm/types.js";
import type { LocaleCode } from "../schemas/locale.js";

export type NodeStatus = "locked" | "active" | "completed";

export interface Route {
  id: string;
  locale: LocaleCode;
  curriculum: Curriculum;
  videosByNodeId: Record<string, VideoResult | null>;
  documentsByNodeId: Record<string, NodeDocument | undefined>;
  challengesByNodeId: Record<string, Challenge | undefined>;
  createdAt: string;
}

export interface RouteProgress {
  routeId: string;
  completedNodeIds: string[];
}

/**
 * El estado de un nodo (bloqueado/activo/completado) se DERIVA de sus
 * prerequisitos + los nodos ya completados — nunca se guarda como campo
 * independiente, para que nunca pueda quedar desincronizado.
 */
export function computeNodeStatuses(
  nodes: CurriculumNode[],
  completedNodeIds: string[]
): Record<string, NodeStatus> {
  const completed = new Set(completedNodeIds);
  const statuses: Record<string, NodeStatus> = {};

  for (const node of nodes) {
    if (completed.has(node.id)) {
      statuses[node.id] = "completed";
      continue;
    }
    const prerequisitesMet = node.prerequisites.every((id) => completed.has(id));
    statuses[node.id] = prerequisitesMet ? "active" : "locked";
  }

  return statuses;
}

export function computeGlobalProgress(nodes: CurriculumNode[], completedNodeIds: string[]): number {
  if (nodes.length === 0) return 0;
  return Math.round((completedNodeIds.length / nodes.length) * 100);
}
