import { z } from "zod";
import { ContentTypeSchema } from "./curriculum.schema.js";

export { ContentTypeSchema };
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Unión discriminada por "kind": cada tipo de reto tiene su propia forma.
 * El frontend hace switch(challenge.kind) y renderiza el componente correcto
 * (CodeChallenge / QuizChallenge / FlashcardChallenge) sin adivinar campos.
 */

const CodeChallengeSchema = z.object({
  kind: z.literal("code"),
  contentType: z.literal("procedural"),
  prompt: z.string().min(1),
  language: z.string().min(1), // "javascript", "python", etc.
  starterCode: z.string(),
  testCode: z.string(), // se ejecuta en sandbox contra la solución del usuario
});

const QuizChallengeSchema = z.object({
  kind: z.literal("quiz"),
  contentType: z.literal("factual"),
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string(),
});

const FlashcardChallengeSchema = z.object({
  kind: z.literal("flashcard"),
  contentType: z.literal("language"),
  prompt: z.string().min(1), // ej. "Traduce: 'buenos días'"
  acceptedAnswers: z.array(z.string()).min(1), // variantes aceptadas
});

const OpenResponseChallengeSchema = z.object({
  kind: z.literal("open_response"),
  contentType: z.literal("creative"),
  prompt: z.string().min(1),
  rubric: z.string().min(1), // usado por gradeOpenResponse (LLM-como-juez)
});

export const ChallengeSchema = z.discriminatedUnion("kind", [
  CodeChallengeSchema,
  QuizChallengeSchema,
  FlashcardChallengeSchema,
  OpenResponseChallengeSchema,
]);
export type Challenge = z.infer<typeof ChallengeSchema>;

export const CHALLENGE_JSON_SCHEMA_BY_TYPE: Record<ContentType, unknown> = {
  procedural: {
    name: "code_challenge",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string" },
        language: { type: "string" },
        starterCode: { type: "string" },
        testCode: { type: "string" },
      },
      required: ["prompt", "language", "starterCode", "testCode"],
    },
  },
  factual: {
    name: "quiz_challenge",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string" },
        options: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
        correctOptionIndex: { type: "integer" },
        explanation: { type: "string" },
      },
      required: ["prompt", "options", "correctOptionIndex", "explanation"],
    },
  },
  language: {
    name: "flashcard_challenge",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string" },
        acceptedAnswers: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: ["prompt", "acceptedAnswers"],
    },
  },
  creative: {
    name: "open_response_challenge",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string" },
        rubric: { type: "string" },
      },
      required: ["prompt", "rubric"],
    },
  },
};
