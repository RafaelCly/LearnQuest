import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { generateRoute, fetchRoute } from "./lib/api";
import { SkillTreeCanvas } from "./components/SkillTree/SkillTreeCanvas";
import { ProgressBar } from "./components/ProgressBar";
import { NodeDetailPanel } from "./components/NodeDetail/NodeDetailPanel";
import type { RouteNode } from "./types/route";

export default function App() {
  const [topic, setTopic] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<RouteNode | null>(null);

  const generateMutation = useMutation({
    mutationFn: (topic: string) => generateRoute(topic),
    onSuccess: (route) => setRouteId(route.id),
  });

  const routeQuery = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => fetchRoute(routeId!),
    enabled: Boolean(routeId),
  });

  if (!routeId) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4">
        <form
          className="w-full max-w-lg space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) generateMutation.mutate(topic.trim());
          }}
        >
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={22} />
            <h1 className="text-2xl font-bold text-foreground">LearnQuest</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Escribe un tema y genera una ruta de aprendizaje gamificada con videos, documentos y retos prácticos.
          </p>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej. React Hooks, Historia del Perú, Verbos irregulares en inglés..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!topic.trim() || generateMutation.isPending}
            className="w-full py-3 rounded-lg bg-accent text-on-primary font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {generateMutation.isPending ? "Generando ruta..." : "Generar ruta"}
          </button>
          {generateMutation.isError && (
            <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
          )}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="px-6 py-4 border-b border-border space-y-3">
        <h1 className="text-xl font-bold text-foreground">{routeQuery.data?.title ?? "Cargando ruta..."}</h1>
        {routeQuery.data && (
          <ProgressBar
            percent={routeQuery.data.progress.percent}
            completedCount={routeQuery.data.progress.completedNodeIds.length}
            totalCount={routeQuery.data.nodes.length}
          />
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6">
          {routeQuery.isLoading && <p className="text-muted-foreground">Cargando &aacute;rbol de habilidades...</p>}
          {routeQuery.data && (
            <SkillTreeCanvas nodes={routeQuery.data.nodes} onSelectNode={setSelectedNode} />
          )}
        </div>

        {selectedNode && (
          <NodeDetailPanel routeId={routeId} node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>
    </main>
  );
}
