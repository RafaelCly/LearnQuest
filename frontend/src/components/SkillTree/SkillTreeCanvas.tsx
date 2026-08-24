import { useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls, type Node as FlowNode } from "reactflow";
import "reactflow/dist/style.css";
import { Lock, Sparkles, CheckCircle2 } from "lucide-react";
import type { RouteNode } from "../../types/route";
import { layoutSkillTree } from "./layout";
import { SkillNode } from "./SkillNode";

const nodeTypes = { skillNode: SkillNode };

interface SkillTreeCanvasProps {
  nodes: RouteNode[];
  onSelectNode: (node: RouteNode) => void;
  celebratingNodeId?: string | null;
}

export function SkillTreeCanvas({ nodes, onSelectNode, celebratingNodeId }: SkillTreeCanvasProps) {
  const { flowNodes, flowEdges } = useMemo(() => layoutSkillTree(nodes), [nodes]);

  const flowNodesWithCelebration = useMemo(
    () =>
      flowNodes.map((n) =>
        n.id === celebratingNodeId ? { ...n, data: { ...n.data, celebrate: true } } : n
      ),
    [flowNodes, celebratingNodeId]
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, flowNode: FlowNode) => {
      const node = nodes.find((n) => n.id === flowNode.id);
      if (!node || node.status === "locked") return; // los nodos bloqueados no son interactivos
      onSelectNode(node);
    },
    [nodes, onSelectNode]
  );

  return (
    <div className="relative h-full w-full rounded-xl border border-border overflow-hidden bg-primary/20">
      <ReactFlow
        nodes={flowNodesWithCelebration}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="var(--color-border)" gap={24} />
        <Controls showInteractive={false} position="bottom-right" className="!shadow-none [&>button]:!border-border [&>button]:!bg-primary [&>button]:!fill-foreground [&>button]:hover:!bg-secondary" />
      </ReactFlow>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-border bg-primary/90 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <Lock size={12} className="text-node-locked-fg" /> Bloqueado
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-node-active-border" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-accent" /> Completado
        </span>
      </div>
    </div>
  );
}
