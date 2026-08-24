import { Handle, Position, type NodeProps } from "reactflow";
import { Lock, CheckCircle2, Code2, BookOpen, Languages, Palette } from "lucide-react";
import type { RouteNode, ContentType, NodeStatus } from "../../types/route";
import { NODE_DIAMETER } from "./layout";

const CONTENT_TYPE_ICON: Record<ContentType, typeof Code2> = {
  procedural: Code2,
  factual: BookOpen,
  language: Languages,
  creative: Palette,
};

const STATUS_STYLES: Record<NodeStatus, string> = {
  locked: "bg-node-locked-bg border-node-locked-border text-node-locked-fg cursor-not-allowed",
  active:
    "bg-node-active-bg border-node-active-border text-node-active-fg shadow-[0_0_0_6px_var(--color-node-active-glow)] cursor-pointer",
  completed:
    "bg-node-completed-bg border-node-completed-border text-node-completed-fg shadow-[0_0_0_4px_var(--color-node-completed-glow)] cursor-pointer",
};

interface SkillNodeData {
  node: RouteNode;
  celebrate?: boolean;
}

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const { node, celebrate } = data;
  const Icon = CONTENT_TYPE_ICON[node.contentType];
  const isLocked = node.status === "locked";

  return (
    <div className="flex flex-col items-center" style={{ width: NODE_DIAMETER + 56 }}>
      <Handle type="target" position={Position.Top} className="!bg-border !border-0 !w-1 !h-1" />

      <div
        title={isLocked ? `${node.title} (bloqueado — completa los nodos anteriores)` : node.title}
        aria-disabled={isLocked}
        className={`relative flex items-center justify-center rounded-full border-[3px] transition-all duration-200 ${STATUS_STYLES[node.status]} ${celebrate ? "node-celebrate" : ""}`}
        style={{ width: NODE_DIAMETER, height: NODE_DIAMETER }}
      >
        {node.status === "locked" && <Lock size={26} aria-hidden />}
        {node.status === "active" && <Icon size={28} aria-hidden />}
        {node.status === "completed" && <CheckCircle2 size={30} aria-hidden />}

        <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-secondary text-[10px] font-bold text-foreground">
          {DIFFICULTY_BADGE[node.difficulty]}
        </span>
      </div>

      <p
        title={node.title}
        className={`mt-2 max-w-[130px] truncate text-center text-xs font-semibold ${isLocked ? "text-node-locked-fg" : "text-foreground"}`}
      >
        {node.title}
      </p>
      <p className="text-[10px] text-muted-foreground">{node.estimatedMinutes} min</p>

      <Handle type="source" position={Position.Bottom} className="!bg-border !border-0 !w-1 !h-1" />
    </div>
  );
}

const DIFFICULTY_BADGE: Record<RouteNode["difficulty"], string> = {
  beginner: "1",
  intermediate: "2",
  advanced: "3",
};
