import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, ExternalLink, TriangleAlert, VideoOff } from "lucide-react";
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
    <aside className="h-full w-full md:max-w-md flex flex-col bg-primary border-l border-border">
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{CONTENT_TYPE_LABEL[node.contentType]}</p>
          <h2 className="text-lg font-semibold text-foreground truncate">{node.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Video</h3>
          {embedUrl ? (
            <div className="space-y-2">
              <div className="relative w-full overflow-hidden rounded-lg border border-border aspect-video bg-black">
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
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={12} /> Ver en YouTube: {node.video?.title}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              <VideoOff size={16} /> No se encontró un video para este nodo.
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Documento complementario</h3>
          {documentQuery.isLoading && <DocumentSkeleton />}
          {documentQuery.isError && <p className="text-sm text-destructive">No se pudo generar el documento.</p>}
          {documentQuery.data && (
            <div className="space-y-2">
              {!documentQuery.data.groundedInTranscript && (
                <p className="flex items-center gap-1.5 text-xs text-amber-400">
                  <TriangleAlert size={13} /> Sin transcripción del video: resumen general, no específico del video.
                </p>
              )}
              <div className="doc-prose prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{documentQuery.data.markdown}</ReactMarkdown>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Reto práctico</h3>
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
    </aside>
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
