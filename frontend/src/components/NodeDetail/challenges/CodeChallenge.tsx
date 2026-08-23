import { useState } from "react";
import type { PublicChallenge } from "../../../types/route";

interface CodeChallengeProps {
  challenge: Extract<PublicChallenge, { kind: "code" }>;
  onSubmit: (code: string) => void;
  disabled: boolean;
}

// Editor de texto plano para el MVP — un editor tipo Monaco/CodeMirror con
// resaltado de sintaxis es una mejora de UI, no un requisito para validar
// el flujo end-to-end (generar reto -> enviar -> calificar).
export function CodeChallenge({ challenge, onSubmit, disabled }: CodeChallengeProps) {
  const [code, setCode] = useState(challenge.starterCode);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{challenge.prompt}</p>
      <p className="text-xs text-muted-foreground">Lenguaje: {challenge.language}</p>
      <textarea
        value={code}
        disabled={disabled}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={10}
        className="w-full px-3 py-2 rounded-lg border border-border bg-[#0b1220] text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(code)}
        className="w-full py-2 rounded-lg bg-accent text-on-primary text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Ejecutar y comprobar
      </button>
    </div>
  );
}
