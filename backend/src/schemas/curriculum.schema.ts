import { z } from "zod";

/**
 * Tipos de contenido cerrados: no generalizamos por "tema" (infinito),
 * generalizamos por tipo de contenido, que determina qué plantilla de
 * reto se dispara (ver services/challenges).
 */
export const ContentTypeSchema = z.enum([
  "procedural", // código, matemáticas -> reto ejecutable/auto-testeado
  "factual", // historia, ciencia, teoría -> quiz opción múltiple
  "language", // idiomas, vocabulario -> fill-in-the-blank / flashcards
  "creative", // escritura, diseño, cocina -> rúbrica + LLM-como-juez (fuera del MVP)
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const CurriculumNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentType: ContentTypeSchema,
  difficulty: DifficultySchema,
  // Query optimizada para buscar el mejor video en YouTube (no siempre es el título del nodo)
  searchQuery: z.string().min(1),
  // IDs de otros nodos que deben completarse antes de desbloquear este
  prerequisites: z.array(z.string()),
  estimatedMinutes: z.number().int().positive(),
});
export type CurriculumNode = z.infer<typeof CurriculumNodeSchema>;

export const CurriculumSchema = z.object({
  topic: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  nodes: z.array(CurriculumNodeSchema).min(1),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;

/**
 * JSON Schema equivalente para Structured Outputs (Azure AI Foundry / OpenAI).
 * Se mantiene manual (no auto-derivado de zod) porque Structured Outputs exige
 * "additionalProperties: false" y "required" en TODAS las propiedades incluso
 * las opcionales — zod-to-json-schema no siempre produce exactamente eso.
 */
export const CURRICULUM_JSON_SCHEMA = {
  name: "curriculum",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      topic: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      nodes: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", description: "slug único, ej. 'react-hooks-basics'" },
            title: { type: "string" },
            summary: { type: "string", description: "2-3 frases sobre qué cubre el nodo" },
            contentType: {
              type: "string",
              enum: ["procedural", "factual", "language", "creative"],
            },
            difficulty: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
            },
            searchQuery: {
              type: "string",
              description: "query optimizada para YouTube Data API, no el título literal del nodo",
            },
            prerequisites: {
              type: "array",
              items: { type: "string" },
              description: "ids de otros nodos que deben completarse antes",
            },
            estimatedMinutes: { type: "integer" },
          },
          required: [
            "id",
            "title",
            "summary",
            "contentType",
            "difficulty",
            "searchQuery",
            "prerequisites",
            "estimatedMinutes",
          ],
        },
      },
    },
    required: ["topic", "title", "description", "nodes"],
  },
} as const;
