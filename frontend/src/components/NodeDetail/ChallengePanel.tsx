import type { PublicChallenge } from "../../types/route";
import type { ChallengeSubmission } from "../../lib/api";
import { QuizChallenge } from "./challenges/QuizChallenge";
import { FlashcardChallenge } from "./challenges/FlashcardChallenge";
import { CodeChallenge } from "./challenges/CodeChallenge";

interface ChallengePanelProps {
  challenge: PublicChallenge;
  onSubmit: (submission: ChallengeSubmission) => void;
  disabled: boolean;
}

/**
 * El tipo de contenido del nodo determina qué plantilla de reto se renderiza
 * — la pieza central de la idea de "retos genéricos por tipo, no por tema".
 */
export function ChallengePanel({ challenge, onSubmit, disabled }: ChallengePanelProps) {
  switch (challenge.kind) {
    case "quiz":
      return (
        <QuizChallenge
          challenge={challenge}
          disabled={disabled}
          onSubmit={(quizOptionIndex) => onSubmit({ quizOptionIndex })}
        />
      );
    case "flashcard":
      return (
        <FlashcardChallenge
          challenge={challenge}
          disabled={disabled}
          onSubmit={(flashcardAnswer) => onSubmit({ flashcardAnswer })}
        />
      );
    case "code":
      return (
        <CodeChallenge
          challenge={challenge}
          disabled={disabled}
          onSubmit={(codeSubmission) => onSubmit({ codeSubmission })}
        />
      );
    case "open_response":
      // Fuera de alcance del MVP (ver one-pager, tipo creativo/subjetivo).
      return (
        <p className="text-sm text-muted-foreground">
          Los retos creativos todavía no están disponibles en esta versión.
        </p>
      );
  }
}
