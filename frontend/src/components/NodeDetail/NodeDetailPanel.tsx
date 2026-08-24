import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, ExternalLink, TriangleAlert, VideoOff, FileText, Swords } from "lucide-react";
import type { RouteNode } from "../../types/route";
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

/**
 * Vista de "lección" a pantalla completa (no un panel lateral angosto):
 * video grande arriba, documento debajo en su propia tarjeta, evaluación
 * al final en otra tarjeta claramente separada — cada sección con espacio
 * para respirar en vez de todo apretado en una columna de 448px.
 */
export function NodeDetailPanel({ routeId, node, onClose, onPassed, onContinue }: NodeDetailPanelProps) {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);

  const documentQuery = useQuery({
    queryKey: ["node-document", routeId, node.id],
    queryFn: () => fetchNodeDocument(routeId, node.id),
  });

  const challengeQuery = useQuery({
    queryKey: ["node-challenge", routeId, node.id],
    queryFn: () => fetchNodeChallenge(routeId, node.id),
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
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{CONTENT_TYPE_LABEL[node.contentType]}</p>
          <h1 className="truncate text-base font-bold text-foreground md:text-lg">{node.title}</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Volver al camino"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X size={16} /> Cerrar
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 space-y-8">
        {/* --- Video --- */}
        <section>
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
        </section>

        {/* --- Documento --- */}
        <section className="rounded-2xl border border-border bg-secondary/20 p-5 md:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText size={16} className="text-accent" /> Documento complementario
          </h2>
          {documentQuery.isLoading && <DocumentSkeleton />}
          {documentQuery.isError && <p className="text-sm text-destructive">No se pudo generar el documento.</p>}
          {documentQuery.data && (
            <div className="space-y-3">
              {!documentQuery.data.groundedInTranscript && (
                <p className="flex items-center gap-1.5 text-xs text-amber-400">
                  <TriangleAlert size={13} /> Sin transcripción del video: resumen general, no específico del video.
                </p>
              )}
              <div className="doc-prose prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{documentQuery.data.markdown}</ReactMarkdown>
              </div>
            </div>
          )}
        </section>

        {/* --- Evaluación --- */}
        <section className="rounded-2xl border border-node-active-border/40 bg-node-active-bg/40 p-5 md:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Swords size={16} className="text-node-active-border" /> Pon a prueba lo aprendido
          </h2>
          {challengeQuery.isLoading && <ChallengeSkeleton />}
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
        </section>
      </div>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden>
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden>
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-9 w-full rounded-lg bg-muted" />
      <div className="h-9 w-full rounded-lg bg-muted" />
      <div className="h-9 w-full rounded-lg bg-muted" />
    </div>
  );
}

const CONTENT_TYPE_LABEL: Record<RouteNode["contentType"], string> = {
  procedural: "Procedimental",
  factual: "Conceptual",
  language: "Idioma",
  creative: "Creativo",
};
