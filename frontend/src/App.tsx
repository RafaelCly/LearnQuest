import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, RotateCcw, ArrowLeft, Video, FileText, Swords, ChevronRight, type LucideIcon } from "lucide-react";
import { generateRoute, fetchRoute } from "./lib/api";
import { SkillTreeCanvas } from "./components/SkillTree/SkillTreeCanvas";
import { ProgressBar } from "./components/ProgressBar";
import { NodeDetailPanel } from "./components/NodeDetail/NodeDetailPanel";
import type { RouteNode, LocaleCode } from "./types/route";
import { LOCALE_OPTIONS } from "./types/route";

const GENERATING_MESSAGES = [
  "Analizando el tema...",
  "Diseñando la malla curricular...",
  "Buscando los mejores videos...",
  "Preparando los retos prácticos...",
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [locale, setLocale] = useState<LocaleCode>("es");
  // Se inicializa desde la URL (?ruta=<id>) para que un refresh de página no
  // te bote a la pantalla de inicio y te haga perder acceso a la ruta.
  const [routeId, setRouteId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("ruta"));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [celebratingNodeId, setCelebratingNodeId] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const generateMutation = useMutation({
    mutationFn: ({ topic, locale }: { topic: string; locale: LocaleCode }) => generateRoute(topic, locale),
    onSuccess: (route) => {
      setRouteId(route.id);
      const url = new URL(window.location.href);
      url.searchParams.set("ruta", route.id);
      window.history.pushState({}, "", url);
    },
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
    const url = new URL(window.location.href);
    url.searchParams.delete("ruta");
    window.history.pushState({}, "", url);
  }

  // Un link a una ruta que ya no existe (vieja, o con id inválido) no debe
  // dejar al usuario viendo "Cargando ruta..." para siempre.
  useEffect(() => {
    if (routeQuery.isError) handleNewRoute();
  }, [routeQuery.isError]);

  const selectedNode: RouteNode | undefined = routeQuery.data?.nodes.find((n) => n.id === selectedNodeId);

  if (!routeId) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-4 py-12">
        <form
          className="w-full max-w-lg space-y-6 fade-up-enter"
          onSubmit={(e) => {
            e.preventDefault();
            if (topic.trim()) generateMutation.mutate({ topic: topic.trim(), locale });
          }}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="hero-glow absolute inset-[-14px]" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-node-active-border bg-node-active-bg text-node-active-fg shadow-[0_0_0_6px_var(--color-node-active-glow)]">
                <Sparkles size={26} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">LearnQuest</h1>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
                Escribe un tema y genera una ruta de aprendizaje gamificada, paso a paso.
              </p>
            </div>

            {/* Mini preview del camino: video -> documento -> reto, antes de generar nada */}
            <div className="flex items-center gap-1.5 text-muted-foreground" aria-hidden>
              <MiniStep icon={Video} label="Video" />
              <ChevronRight size={14} className="text-border shrink-0" />
              <MiniStep icon={FileText} label="Documento" />
              <ChevronRight size={14} className="text-border shrink-0" />
              <MiniStep icon={Swords} label="Reto" />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-primary/60 p-4 backdrop-blur-sm">
            <input
              type="text"
              value={topic}
              disabled={generateMutation.isPending}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej. React Hooks, Historia del Perú, Verbos irregulares en inglés..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-secondary/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 transition-shadow"
            />

            <div role="radiogroup" aria-label="Idioma del contenido" className="flex flex-wrap gap-1.5">
              {LOCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={locale === opt.value}
                  disabled={generateMutation.isPending}
                  onClick={() => setLocale(opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    locale === opt.value
                      ? "border-action bg-action text-on-action"
                      : "border-border bg-secondary/40 text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || generateMutation.isPending}
              className="w-full py-3 rounded-lg bg-action text-on-action font-semibold shadow-[0_4px_20px_-4px_var(--color-action)]/40 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
            >
              {generateMutation.isPending ? "Generando..." : "Generar ruta"}
            </button>
          </div>

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
                onClick={() => topic.trim() && generateMutation.mutate({ topic: topic.trim(), locale })}
                className="flex items-center gap-1 text-sm font-medium text-foreground shrink-0 cursor-pointer active:scale-95 transition-transform"
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
    <main className="min-h-dvh flex flex-col fade-up-enter">
      <header className="px-4 md:px-6 py-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg md:text-xl font-bold text-foreground">{routeQuery.data?.title ?? "Cargando ruta..."}</h1>
          <button
            type="button"
            onClick={handleNewRoute}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground shrink-0 cursor-pointer active:scale-95 transition-all"
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
          <NodeDetailPanel
            key={selectedNode.id}
            routeId={routeId}
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onPassed={celebrate}
            onContinue={handleContinue}
          />
        )}
      </div>
    </main>
  );
}

function MiniStep({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-[11px]">
      <Icon size={11} />
      {label}
    </span>
  );
}
