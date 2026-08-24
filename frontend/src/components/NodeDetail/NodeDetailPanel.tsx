import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  ExternalLink,
  Info,
  VideoOff,
  FileText,
  Swords,
  ArrowLeft,
  Clock,
  Code2,
  BookOpen,
  Languages,
  Palette,
  Video,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { RouteNode, ContentType, Difficulty, VideoResult } from "../../types/route";
import { fetchNodeDocument, fetchNodeChallenge, submitChallenge, type ChallengeSubmission } from "../../lib/api";
import { ChallengePanel } from "./ChallengePanel";
import { ChallengeResults } from "./ChallengeResults";

interface NodeDetailPanelProps {
  routeId: string;
  node: RouteNode;
  onClose: () => void;
  onPassed: (nodeId: string) => void;
  onContinue: () => void;
}

type View = "lesson" | "challenge";

/**
 * Dos vistas separadas en vez de un solo scroll largo (video + documento +
 * reto apilados, que se sentía "todo apretado y vertical"):
 * - "lesson": video y documento lado a lado (desktop) para leer mientras se ve.
 * - "challenge": pantalla completa dedicada, sin distracciones, para el reto.
 * Se entra a "challenge" con un botón explícito, no aparece automático.
 */
export function NodeDetailPanel({ routeId, node, onClose, onPassed, onContinue }: NodeDetailPanelProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("lesson");
  const [attempt, setAttempt] = useState(0);

  const documentQuery = useQuery({
    queryKey: ["node-document", routeId, node.id],
    queryFn: () => fetchNodeDocument(routeId, node.id),
  });

  const challengeQuery = useQuery({
    queryKey: ["node-challenge", routeId, node.id],
    queryFn: () => fetchNodeChallenge(routeId, node.id),
    enabled: view === "challenge",
  });

  const submitMutation = useMutation({
    mutationFn: (submission: ChallengeSubmission) => submitChallenge(routeId, node.id, submission),
    onSuccess: (data) => {
      if (data.grade.passed) {
        queryClient.invalidateQueries({ queryKey: ["route", routeId] });
        onPassed(node.id);
      }
    },
  });

  const embedUrl = node.video ? `https://www.youtube-nocookie.com/embed/${node.video.videoId}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {view === "challenge" && (
            <button
              type="button"
              onClick={() => setView("lesson")}
              aria-label="Volver a la lección"
              className="flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {view === "challenge" ? "Reto" : CONTENT_TYPE_LABEL[node.contentType]}
            </p>
            <h1 className="truncate text-base font-bold text-foreground md:text-lg">{node.title}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver al camino"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
        >
          <X size={16} /> Cerrar
        </button>
      </header>

      {view === "lesson" ? (
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 fade-up-enter">
          {documentQuery.isLoading ? (
            <LoadingState message="Preparando tu lección..." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                {/* --- Video (fijo al hacer scroll en desktop) --- */}
                <section className="lg:sticky lg:top-20">
                  {embedUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-black/20">
                      <div className="relative aspect-video w-full bg-black">
                        <iframe
                          src={embedUrl}
                          title={node.video?.title}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <a
                        href={node.video?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 border-t border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">Ver en YouTube: {node.video?.title}</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-14 text-muted-foreground">
                      <VideoOff size={28} />
                      <p className="text-sm">No se encontró un video para este nodo.</p>
                    </div>
                  )}

                  {documentQuery.data && !documentQuery.data.groundedInTranscript && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Info size={12} className="shrink-0" />
                      Documento generado sin transcripción del video: es un resumen general del tema.
                    </p>
                  )}

                  {node.video && node.video.alternates.length > 0 && (
                    <OtherVideosList videos={node.video.alternates} />
                  )}

                  <NodeMetaCard node={node} />

                  <button
                    type="button"
                    onClick={() => setView("challenge")}
                    className="mt-4 hidden w-full items-center justify-center gap-2 rounded-2xl bg-action py-4 text-sm font-semibold text-on-action cursor-pointer transition-all active:scale-[0.98] lg:flex"
                  >
                    <Swords size={18} /> Iniciar prueba
                  </button>
                </section>

                {/* --- Documento --- */}
                <section className="rounded-2xl border border-border bg-secondary/20 p-5 md:p-8">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText size={16} className="text-accent" /> Documento complementario
                  </h2>
                  {documentQuery.isError && <p className="text-sm text-destructive">No se pudo generar el documento.</p>}
                  {documentQuery.data && (
                    <div className="doc-prose prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{documentQuery.data.markdown}</ReactMarkdown>
                    </div>
                  )}
                </section>
              </div>

              {/* Botón de prueba en mobile: va al final, no fijo al lado del video */}
              <button
                type="button"
                onClick={() => setView("challenge")}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-action py-4 text-sm font-semibold text-on-action cursor-pointer transition-all active:scale-[0.98] lg:hidden"
              >
                <Swords size={18} /> Iniciar prueba
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-10 md:px-8 fade-up-enter">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
            <Swords size={20} className="text-node-active-border" /> Pon a prueba lo aprendido
          </h2>
          {challengeQuery.isLoading && <LoadingState message="Generando tu prueba..." />}
          {challengeQuery.isError && <p className="text-sm text-destructive">No se pudo generar el reto.</p>}
          {challengeQuery.data && !submitMutation.data && (
            <ChallengePanel
              key={attempt}
              challenge={challengeQuery.data}
              disabled={submitMutation.isPending}
              onSubmit={(submission) => submitMutation.mutate(submission)}
            />
          )}
          {submitMutation.isPending && <p className="mt-2 text-sm text-muted-foreground">Calificando...</p>}
          {submitMutation.isError && (
            <p className="mt-2 text-sm text-destructive">{(submitMutation.error as Error).message}</p>
          )}
          {submitMutation.data && (
            <ChallengeResults
              grade={submitMutation.data.grade}
              onRetry={() => {
                submitMutation.reset();
                setAttempt((a) => a + 1);
              }}
              onContinue={onContinue}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rellena el espacio vacío que quedaba bajo el video/botón en desktop (la
 * columna del documento es mucho más larga) con info real que antes no se
 * mostraba en ningún lado de esta vista: tipo de contenido, dificultad,
 * tiempo estimado -- ya vivían en `node`, solo no se usaban acá.
 */
/**
 * Los candidatos descartados por el ranking (siguientes 2 mejores según el
 * mismo heurístico de vistas/duración/antigüedad, ver youtubeService.ts) no
 * cuestan cuota extra de YouTube -- antes se tiraban, ahora se muestran como
 * alternativas por si el video elegido no le calza al usuario.
 */
function OtherVideosList({ videos }: { videos: VideoResult[] }) {
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">Otros videos que también pueden servir</p>
      <ul className="space-y-1">
        {videos.map((v) => (
          <li key={v.videoId}>
            <a
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
            >
              <Video size={13} className="shrink-0 text-muted-foreground" />
              <span className="truncate">{v.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NodeMetaCard({ node }: { node: RouteNode }) {
  const ContentIcon = CONTENT_TYPE_ICON[node.contentType];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <ContentIcon size={18} className="text-accent" />
        <p className="text-[11px] font-medium text-foreground leading-tight">{CONTENT_TYPE_LABEL[node.contentType]}</p>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Clock size={18} className="text-muted-foreground" />
        <p className="text-[11px] font-medium text-foreground leading-tight">{node.estimatedMinutes} min</p>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <DifficultyDots difficulty={node.difficulty} />
        <p className="text-[11px] font-medium text-foreground leading-tight">{DIFFICULTY_LABEL[node.difficulty]}</p>
      </div>
    </div>
  );
}

function DifficultyDots({ difficulty }: { difficulty: Difficulty }) {
  const level = { beginner: 1, intermediate: 2, advanced: 3 }[difficulty];
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-node-active-border" : "bg-border"}`} />
      ))}
    </div>
  );
}

const CONTENT_TYPE_ICON: Record<ContentType, LucideIcon> = {
  procedural: Code2,
  factual: BookOpen,
  language: Languages,
  creative: Palette,
};

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground" aria-live="polite">
      <Loader2 size={26} className="animate-spin text-accent" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

const CONTENT_TYPE_LABEL: Record<RouteNode["contentType"], string> = {
  procedural: "Procedimental",
  factual: "Conceptual",
  language: "Idioma",
  creative: "Creativo",
};
