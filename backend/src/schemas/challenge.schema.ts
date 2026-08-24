import { z } from "zod";
import { ContentTypeSchema } from "./curriculum.schema.js";

export { ContentTypeSchema };
export type ContentType = z.infer<typeof ContentTypeSchema>;

/** Cuántas preguntas mínimas se generan para retos de tipo quiz/flashcard. */
export const MIN_QUESTIONS_PER_CHALLENGE = 10;
/** % de aciertos necesario para marcar el nodo como completado. */
export const PASS_THRESHOLD = 0.7;

/**
 * Unión discriminada por "kind": cada tipo de reto tiene su propia forma.
 * Quiz y flashcard llevan una LISTA de preguntas (no una sola) — el usuario
 * las responde una por una y el nodo se completa si acierta al menos
 * PASS_THRESHOLD del total, no con una sola pregunta de suerte.
 */

const CodeChallengeSchema = z.object({
  kind: z.literal("code"),
  contentType: z.literal("procedural"),
  prompt: z.string().min(1),
  language: z.string().min(1), // "javascript", "python", etc.
  starterCode: z.string(),
  testCode: z.string(), // se ejecuta en sandbox contra la solución del usuario
});

const QuizQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctOptionIndex: z.number().int().min(0),
  explanation: z.string(),
});

const QuizChallengeSchema = z.object({
  kind: z.literal("quiz"),
  contentType: z.literal("factual"),
  items: z.array(QuizQuestionSchema).min(MIN_QUESTIONS_PER_CHALLENGE),
});

const FlashcardItemSchema = z.object({
  prompt: z.string().min(1), // ej. "Traduce: 'buenos días'"
  acceptedAnswers: z.array(z.string()).min(1), // variantes aceptadas
});

const FlashcardChallengeSchema = z.object({
  kind: z.literal("flashcard"),
  contentType: z.literal("language"),
  items: z.array(FlashcardItemSchema).min(MIN_QUESTIONS_PER_CHALLENGE),
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
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type FlashcardItem = z.infer<typeof FlashcardItemSchema>;

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
        items: {
          type: "array",
          minItems: MIN_QUESTIONS_PER_CHALLENGE,
          maxItems: MIN_QUESTIONS_PER_CHALLENGE,
          items: {
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
      },
      required: ["items"],
    },
  },
  language: {
    name: "flashcard_challenge",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        items: {
          type: "array",
          minItems: MIN_QUESTIONS_PER_CHALLENGE,
          maxItems: MIN_QUESTIONS_PER_CHALLENGE,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              prompt: { type: "string" },
              acceptedAnswers: { type: "array", items: { type: "string" }, minItems: 1 },
            },
            required: ["prompt", "acceptedAnswers"],
          },
        },
      },
      required: ["items"],
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
