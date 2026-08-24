import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, RotateCcw, ArrowLeft } from "lucide-react";
import { generateRoute, fetchRoute } from "./lib/api";
import { SkillTreeCanvas } from "./components/SkillTree/SkillTreeCanvas";
import { ProgressBar } from "./components/ProgressBar";
import { NodeDetailPanel } from "./components/NodeDetail/NodeDetailPanel";
import type { RouteNode } from "./types/route";

const GENERATING_MESSAGES = [
  "Analizando el tema...",
  "Diseñando la malla curricular...",
  "Buscando los mejores videos...",
  "Preparando los retos prácticos...",
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [celebratingNodeId, setCelebratingNodeId] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const generateMutation = useMutation({
    mutationFn: (topic: string) => generateRoute(topic),
    onSuccess: (route) => setRouteId(route.id),
  });

  const routeQuery = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => fetchRoute(routeId!),
    enabled: Boolean(routeId),
  });

  useEffect(() => {
    if (!generateMutation.isPending) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => setMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length), 2200);
    return () => clearInterval(interval);
  }, [generateMutation.isPending]);

  const celebrateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function celebrate(nodeId: string) {
    setCelebratingNodeId(nodeId);
    if (celebrateTimeout.current) clearTimeout(celebrateTimeout.current);
    celebrateTimeout.current = setTimeout(() => setCelebratingNodeId(null), 700);
  }

  function handleContinue() {
    const nodes = routeQuery.data?.nodes ?? [];
    const next = nodes.find((n) => n.status === "active" && n.id !== selectedNodeId);
    setSelectedNodeId(next?.id ?? null);
  }

  function handleNewRoute() {
    setRouteId(null);
    setSelectedNodeId(null);
    setTopic("");
    generateMutation.reset();
  }

  const selectedNode: RouteNode | undefined = routeQuery.data?.nodes.find((n) => n.id === selectedNodeId);

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
            disabled={generateMutation.isPending}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej. React Hooks, Historia del Perú, Verbos irregulares en inglés..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!topic.trim() || generateMutation.isPending}
            className="w-full py-3 rounded-lg bg-accent text-on-primary font-semibold disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-opacity"
          >
            {generateMutation.isPending ? "Generando..." : "Generar ruta"}
          </button>

          {generateMutation.isPending && (
            <p className="text-center text-sm text-muted-foreground animate-pulse" aria-live="polite">
              {GENERATING_MESSAGES[messageIndex]}
            </p>
          )}

          {generateMutation.isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
              <button
                type="button"
                onClick={() => topic.trim() && generateMutation.mutate(topic.trim())}
                className="flex items-center gap-1 text-sm font-medium text-foreground shrink-0 cursor-pointer"
              >
                <RotateCcw size={14} /> Reintentar
              </button>
            </div>
          )}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="px-4 md:px-6 py-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg md:text-xl font-bold text-foreground">{routeQuery.data?.title ?? "Cargando ruta..."}</h1>
          <button
            type="button"
            onClick={handleNewRoute}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          >
            <ArrowLeft size={14} /> Nueva ruta
          </button>
        </div>
        {routeQuery.data && (
          <ProgressBar
            percent={routeQuery.data.progress.percent}
            completedCount={routeQuery.data.progress.completedNodeIds.length}
            totalCount={routeQuery.data.nodes.length}
          />
        )}
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 md:p-6 min-w-0">
          {routeQuery.isLoading && <p className="text-muted-foreground">Cargando el camino de aprendizaje...</p>}
          {routeQuery.data && (
            <SkillTreeCanvas
              nodes={routeQuery.data.nodes}
              onSelectNode={(n) => setSelectedNodeId(n.id)}
              celebratingNodeId={celebratingNodeId}
            />
          )}
        </div>

        {selectedNode && (
          <div className="fixed inset-0 z-40 md:static md:inset-auto md:z-auto">
            <NodeDetailPanel
              routeId={routeId}
              node={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onPassed={celebrate}
              onContinue={handleContinue}
            />
          </div>
        )}
      </div>
    </main>
  );
}
