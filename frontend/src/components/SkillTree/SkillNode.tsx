import { Handle, Position, type NodeProps } from "reactflow";
import { Lock, CheckCircle2, Code2, BookOpen, Languages, Palette } from "lucide-react";
import type { RouteNode, ContentType, NodeStatus } from "../../types/route";
import { NODE_WIDTH } from "./layout";

const CONTENT_TYPE_ICON: Record<ContentType, typeof Code2> = {
  procedural: Code2,
  factual: BookOpen,
  language: Languages,
  creative: Palette,
};

const STATUS_STYLES: Record<NodeStatus, string> = {
  locked: "bg-node-locked-bg border-node-locked-border text-node-locked-fg cursor-not-allowed opacity-70",
  active:
    "bg-node-active-bg border-node-active-border text-node-active-fg shadow-[0_0_18px_var(--color-node-active-glow)] cursor-pointer",
  completed: "bg-node-completed-bg border-node-completed-border text-node-completed-fg cursor-pointer",
};

export function SkillNode({ data }: NodeProps<{ node: RouteNode }>) {
  const { node } = data;
  const Icon = CONTENT_TYPE_ICON[node.contentType];
  const isLocked = node.status === "locked";

  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={`rounded-xl border-2 px-4 py-3 transition-colors duration-200 ${STATUS_STYLES[node.status]}`}
      aria-disabled={isLocked}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />

      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          {node.status === "locked" && <Lock size={18} aria-hidden />}
          {node.status === "active" && <Icon size={18} aria-hidden />}
          {node.status === "completed" && <CheckCircle2 size={18} aria-hidden />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug truncate">{node.title}</p>
          <p className="text-xs opacity-80 mt-0.5">{node.estimatedMinutes} min &middot; {LEVEL_LABEL[node.difficulty]}</p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}

const LEVEL_LABEL: Record<RouteNode["difficulty"], string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};
