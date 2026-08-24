import { CheckCircle2, XCircle, PartyPopper, RotateCcw, ArrowRight } from "lucide-react";
import type { GradeResult } from "../../types/route";

interface ChallengeResultsProps {
  grade: GradeResult;
  onRetry: () => void;
  onContinue?: () => void;
}

export function ChallengeResults({ grade, onRetry, onContinue }: ChallengeResultsProps) {
  return (
    <div className="space-y-4 fade-up-enter">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          grade.passed ? "border-node-completed-border bg-node-completed-bg" : "border-destructive/50 bg-destructive/10"
        }`}
      >
        {grade.passed ? (
          <PartyPopper size={22} className="text-accent shrink-0" />
        ) : (
          <XCircle size={22} className="text-destructive shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {grade.passed ? "¡Nodo completado!" : "Todavía no llegaste al puntaje mínimo"}
          </p>
          <p className="text-xs text-muted-foreground">{grade.feedback}</p>
        </div>
      </div>

      {grade.itemResults && grade.itemResults.length > 0 && (
        <ol className="space-y-1.5">
          {grade.itemResults.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              {item.correct ? (
                <CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" />
              ) : (
                <XCircle size={14} className="text-destructive shrink-0 mt-0.5" />
              )}
              <span className={item.correct ? "text-muted-foreground" : "text-foreground"}>
                Pregunta {i + 1}
                {!item.correct && item.explanationOrExpected && ` — ${item.explanationOrExpected}`}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2">
        {!grade.passed && (
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 py-2 rounded-lg border border-border text-foreground text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:border-muted-foreground transition-all active:scale-[0.98]"
          >
            <RotateCcw size={14} /> Reintentar
          </button>
        )}
        {grade.passed && onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            Continuar <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
