import type { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import type { RouteNode } from "../../types/route";

const NODE_DIAMETER = 84;
const LEVEL_GAP_Y = 168;
const NODE_GAP_X = 56;
/** Desplazamiento horizontal alternado por nivel: le da forma de sendero serpenteante en vez de grilla rígida. */
const ZIGZAG_AMPLITUDE = 70;

/**
 * Layout vertical tipo sendero de misiones: el nivel de cada nodo es
 * 1 + el nivel máximo de sus prerequisitos (los nodos raíz quedan en el
 * nivel 0, arriba). Los niveles se desplazan alternadamente en zigzag para
 * que la ruta se sienta como un camino, no como un organigrama.
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
  let order = 0;
  for (const [level, levelNodes] of nodesByLevel) {
    const rowWidth = levelNodes.length * NODE_DIAMETER + (levelNodes.length - 1) * NODE_GAP_X;
    // Zigzag solo cuando el nivel es angosto (1-2 nodos); niveles anchos (hubs
    // con varias ramas) se mantienen centrados para no verse descuadrados.
    const zigzag = levelNodes.length <= 2 ? (level % 2 === 0 ? -1 : 1) * ZIGZAG_AMPLITUDE : 0;
    levelNodes.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: "skillNode",
        position: {
          x: index * (NODE_DIAMETER + NODE_GAP_X) - rowWidth / 2 + zigzag,
          y: level * LEVEL_GAP_Y,
        },
        // `order` alimenta el delay de la animación de entrada escalonada
        // (SkillNode.tsx) -- es la posición en el camino, no el índice del nivel.
        data: { node, order: order++ },
      });
    });
  }

  const flowEdges: FlowEdge[] = nodes.flatMap((node) =>
    node.prerequisites
      .filter((id) => nodeById.has(id))
      .map((prerequisiteId) => {
        const source = nodeById.get(prerequisiteId)!;
        const traveled = source.status === "completed" && node.status !== "locked";
        const isNext = source.status === "completed" && node.status === "active";
        const color = traveled ? "var(--color-trail-completed)" : isNext ? "var(--color-trail-active)" : "var(--color-trail)";
        return {
          id: `${prerequisiteId}->${node.id}`,
          source: prerequisiteId,
          target: node.id,
          type: "smoothstep",
          animated: isNext,
          style: { stroke: color, strokeWidth: 4, strokeDasharray: traveled ? undefined : "2 10", strokeLinecap: "round" },
        };
      })
  );

  return { flowNodes, flowEdges };
}

export { NODE_DIAMETER };
