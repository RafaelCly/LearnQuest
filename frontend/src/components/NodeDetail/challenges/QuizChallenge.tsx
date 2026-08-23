import { useState } from "react";
import type { PublicChallenge } from "../../../types/route";

interface QuizChallengeProps {
  challenge: Extract<PublicChallenge, { kind: "quiz" }>;
  onSubmit: (selectedIndex: number) => void;
  disabled: boolean;
}

export function QuizChallenge({ challenge, onSubmit, disabled }: QuizChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{challenge.prompt}</p>
      <div className="space-y-2" role="radiogroup" aria-label="Opciones del quiz">
        {challenge.options.map((option, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected === index}
            disabled={disabled}
            onClick={() => setSelected(index)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${
              selected === index
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
        onClick={() => selected !== null && onSubmit(selected)}
        className="w-full py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Comprobar respuesta
      </button>
    </div>
  );
}
