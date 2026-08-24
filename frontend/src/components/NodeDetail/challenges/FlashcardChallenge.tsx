import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { PublicChallenge } from "../../../types/route";

interface FlashcardChallengeProps {
  challenge: Extract<PublicChallenge, { kind: "flashcard" }>;
  onComplete: (answers: string[]) => void;
  disabled: boolean;
}

export function FlashcardChallenge({ challenge, onComplete, disabled }: FlashcardChallengeProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState("");

  const total = challenge.items.length;
  const item = challenge.items[index];
  const isLast = index === total - 1;

  function handleNext() {
    if (!current.trim() || !item) return;
    const next = [...answers, current.trim()];
    setAnswers(next);
    setCurrent("");
    if (isLast) {
      onComplete(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (!item) return null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
    >
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

      <label htmlFor="flashcard-answer" className="text-sm font-medium text-foreground block">
        {item.prompt}
      </label>
      <input
        id="flashcard-answer"
        type="text"
        value={current}
        disabled={disabled}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Escribe tu respuesta"
        autoComplete="off"
        autoFocus
        className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!current.trim() || disabled}
        className="w-full py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
      >
        {isLast ? "Terminar y calificar" : "Siguiente"}
        {!isLast && <ChevronRight size={16} />}
      </button>
    </form>
  );
}
