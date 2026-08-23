import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, TriangleAlert } from "lucide-react";
import type { RouteNode } from "../../types/route";
import { fetchNodeDocument, fetchNodeChallenge, submitChallenge, type ChallengeSubmission } from "../../lib/api";
import { ChallengePanel } from "./ChallengePanel";

interface NodeDetailPanelProps {
  routeId: string;
  node: RouteNode;
  onClose: () => void;
}

export function NodeDetailPanel({ routeId, node, onClose }: NodeDetailPanelProps) {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<{ passed: boolean; feedback: string } | null>(null);

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
      setLastResult({ passed: data.grade.passed, feedback: data.grade.feedback });
      if (data.grade.passed) {
        // El nodo recién desbloqueado (o el siguiente) depende de este progreso,
        // así que se invalida la ruta completa en vez de solo este nodo.
        queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      }
    },
  });

  return (
    <aside className="h-full w-full max-w-md flex flex-col bg-primary border-l border-border">
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{CONTENT_TYPE_LABEL[node.contentType]}</p>
          <h2 className="text-lg font-semibold text-foreground">{node.title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Video</h3>
          {node.video ? (
            <a
              href={node.video.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground hover:border-muted-foreground"
            >
              <span className="truncate">{node.video.title}</span>
              <ExternalLink size={14} className="shrink-0" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No se encontró un video para este nodo.</p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Documento complementario</h3>
          {documentQuery.isLoading && <p className="text-sm text-muted-foreground">Generando documento...</p>}
          {documentQuery.isError && <p className="text-sm text-destructive">No se pudo generar el documento.</p>}
          {documentQuery.data && (
            <div className="text-sm text-foreground/90 space-y-2">
              {!documentQuery.data.groundedInTranscript && (
                <p className="flex items-center gap-1.5 text-xs text-amber-400">
                  <TriangleAlert size={13} /> Sin transcripción del video: resumen general, no específico del video.
                </p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{documentQuery.data.markdown}</p>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Reto práctico</h3>
          {challengeQuery.isLoading && <p className="text-sm text-muted-foreground">Generando reto...</p>}
          {challengeQuery.isError && <p className="text-sm text-destructive">No se pudo generar el reto.</p>}
          {challengeQuery.data && (
            <ChallengePanel
              challenge={challengeQuery.data}
              disabled={submitMutation.isPending}
              onSubmit={(submission) => submitMutation.mutate(submission)}
            />
          )}
          {submitMutation.isError && (
            <p className="mt-2 text-sm text-destructive">{(submitMutation.error as Error).message}</p>
          )}
          {lastResult && (
            <p className={`mt-3 text-sm font-medium ${lastResult.passed ? "text-accent" : "text-destructive"}`}>
              {lastResult.passed ? "¡Correcto! Nodo completado." : "Todavía no — "}
              {!lastResult.passed && lastResult.feedback}
            </p>
          )}
        </section>
      </div>
    </aside>
  );
}

const CONTENT_TYPE_LABEL: Record<RouteNode["contentType"], string> = {
  procedural: "Procedimental",
  factual: "Conceptual",
  language: "Idioma",
  creative: "Creativo",
};
