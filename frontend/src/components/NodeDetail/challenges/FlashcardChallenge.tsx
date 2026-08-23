import { useState } from "react";
import type { PublicChallenge } from "../../../types/route";

interface FlashcardChallengeProps {
  challenge: Extract<PublicChallenge, { kind: "flashcard" }>;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export function FlashcardChallenge({ challenge, onSubmit, disabled }: FlashcardChallengeProps) {
  const [answer, setAnswer] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (answer.trim()) onSubmit(answer.trim());
      }}
    >
      <label htmlFor="flashcard-answer" className="text-sm font-medium text-foreground block">
        {challenge.prompt}
      </label>
      <input
        id="flashcard-answer"
        type="text"
        value={answer}
        disabled={disabled}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Escribe tu respuesta"
        autoComplete="off"
        className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!answer.trim() || disabled}
        className="w-full py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Comprobar respuesta
      </button>
    </form>
  );
}
