import { useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls, type Node as FlowNode } from "reactflow";
import "reactflow/dist/style.css";
import type { RouteNode } from "../../types/route";
import { layoutSkillTree } from "./layout";
import { SkillNode } from "./SkillNode";

const nodeTypes = { skillNode: SkillNode };

interface SkillTreeCanvasProps {
  nodes: RouteNode[];
  onSelectNode: (node: RouteNode) => void;
}

export function SkillTreeCanvas({ nodes, onSelectNode }: SkillTreeCanvasProps) {
  const { flowNodes, flowEdges } = useMemo(() => layoutSkillTree(nodes), [nodes]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, flowNode: FlowNode) => {
      const node = nodes.find((n) => n.id === flowNode.id);
      if (!node || node.status === "locked") return; // los nodos bloqueados no son interactivos
      onSelectNode(node);
    },
    [nodes, onSelectNode]
  );

  return (
    <div className="h-full w-full rounded-xl border border-border overflow-hidden bg-primary/20">
      <ReactFlow
        nodes={flowNodes}
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
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
