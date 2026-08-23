import type { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import type { RouteNode } from "../../types/route";

const NODE_WIDTH = 240;
const NODE_HEIGHT = 96;
const LEVEL_GAP_Y = 160;
const NODE_GAP_X = 40;

/**
 * Layout vertical tipo árbol de habilidades: el nivel de cada nodo es
 * 1 + el nivel máximo de sus prerequisitos (los nodos raíz quedan en el
 * nivel 0, arriba). Dentro de un nivel se reparten horizontalmente.
 */
export function layoutSkillTree(nodes: RouteNode[]): { flowNodes: FlowNode[]; flowEdges: FlowEdge[] } {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const levelById = new Map<string, number>();

  function levelOf(nodeId: string, seen: Set<string> = new Set()): number {
    if (levelById.has(nodeId)) return levelById.get(nodeId)!;
    if (seen.has(nodeId)) return 0; // corta ciclos accidentales de la IA en vez de recursión infinita
    seen.add(nodeId);

    const node = nodeById.get(nodeId);
    const prerequisites = node?.prerequisites.filter((id) => nodeById.has(id)) ?? [];
    const level = prerequisites.length === 0 ? 0 : 1 + Math.max(...prerequisites.map((id) => levelOf(id, seen)));

    levelById.set(nodeId, level);
    return level;
  }

  for (const node of nodes) levelOf(node.id);

  const nodesByLevel = new Map<number, RouteNode[]>();
  for (const node of nodes) {
    const level = levelById.get(node.id) ?? 0;
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  }

  const flowNodes: FlowNode[] = [];
  for (const [level, levelNodes] of nodesByLevel) {
    const rowWidth = levelNodes.length * NODE_WIDTH + (levelNodes.length - 1) * NODE_GAP_X;
    levelNodes.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: "skillNode",
        position: {
          x: index * (NODE_WIDTH + NODE_GAP_X) - rowWidth / 2,
          y: level * LEVEL_GAP_Y,
        },
        data: { node },
      });
    });
  }

  const flowEdges: FlowEdge[] = nodes.flatMap((node) =>
    node.prerequisites
      .filter((id) => nodeById.has(id))
      .map((prerequisiteId) => ({
        id: `${prerequisiteId}->${node.id}`,
        source: prerequisiteId,
        target: node.id,
        animated: node.status === "active",
        style: { stroke: "var(--color-border)", strokeWidth: 2 },
      }))
  );

  return { flowNodes, flowEdges };
}

export { NODE_WIDTH, NODE_HEIGHT };
