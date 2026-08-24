import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { PublicChallenge } from "../../../types/route";

interface QuizChallengeProps {
  challenge: Extract<PublicChallenge, { kind: "quiz" }>;
  onComplete: (answers: number[]) => void;
  disabled: boolean;
}

/** Recorre las preguntas una por una (estilo Duolingo) y entrega todas las respuestas al final. */
export function QuizChallenge({ challenge, onComplete, disabled }: QuizChallengeProps) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const total = challenge.items.length;
  const item = challenge.items[index];
  const isLast = index === total - 1;

  function handleNext() {
    if (selected === null || !item) return;
    const next = [...answers, selected];
    setAnswers(next);
    setSelected(null);
    if (isLast) {
      onComplete(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (!item) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {index + 1}/{total}
        </span>
      </div>

      <p className="text-sm font-medium text-foreground">{item.prompt}</p>
      <div className="space-y-2" role="radiogroup" aria-label={`Pregunta ${index + 1} de ${total}`}>
        {item.options.map((option, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={selected === i}
            disabled={disabled}
            onClick={() => setSelected(i)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${
              selected === i
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-secondary/40 text-foreground hover:border-muted-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={selected === null || disabled}
        onClick={handleNext}
        className="w-full py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
      >
        {isLast ? "Terminar y calificar" : "Siguiente"}
        {!isLast && <ChevronRight size={16} />}
      </button>
    </div>
  );
}
