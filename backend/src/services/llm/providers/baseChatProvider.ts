import type OpenAI from "openai";
import { CurriculumSchema, CURRICULUM_JSON_SCHEMA, type Curriculum } from "../../../schemas/curriculum.schema.js";
import {
  ChallengeSchema,
  CHALLENGE_JSON_SCHEMA_BY_TYPE,
  MIN_QUESTIONS_PER_CHALLENGE,
  type Challenge,
} from "../../../schemas/challenge.schema.js";
import { LOCALE_NAMES, type LocaleCode } from "../../../schemas/locale.js";
import type {
  LLMProvider,
  GenerateCurriculumInput,
  GenerateDocumentInput,
  NodeDocument,
  GenerateChallengeInput,
  GradeOpenResponseInput,
  GradeResult,
} from "../types.js";

/**
 * Lógica de prompting compartida entre cualquier proveedor compatible con la
 * forma de chat.completions de OpenAI (esto cubre Azure AI Foundry, OpenAI y,
 * si en el futuro se agrega, cualquier gateway compatible). Cada proveedor
 * concreto solo construye el cliente y pasa su nombre de modelo/deployment.
 */
export abstract class BaseChatCompletionsProvider implements LLMProvider {
  abstract readonly name: string;
  protected abstract client: OpenAI;
  protected abstract model: string;

  async generateCurriculum({ topic, locale, targetLevel, maxNodes = 10 }: GenerateCurriculumInput): Promise<Curriculum> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Eres un diseñador instruccional. Genera una malla curricular progresiva (grafo de dependencias, no una lista plana) " +
            `para el tema dado. Máximo ${maxNodes} nodos. Cada nodo debe tener una searchQuery optimizada para buscar ` +
            "el mejor video de YouTube sobre ese subtema específico, no el título literal del nodo. " +
            localeInstruction(locale),
        },
        { role: "user", content: `Tema: "${topic}"${targetLevel ? `. Nivel objetivo: ${targetLevel}.` : ""}` },
      ],
      response_format: { type: "json_schema", json_schema: CURRICULUM_JSON_SCHEMA as any },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error(`${this.name}: no devolvió contenido para la malla curricular`);
    return CurriculumSchema.parse(JSON.parse(raw));
  }

  async generateNodeDocument({ nodeTitle, nodeSummary, locale, videoTranscript }: GenerateDocumentInput): Promise<NodeDocument> {
    const groundedInTranscript = Boolean(videoTranscript);
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Escribe una nota de estudio en markdown que complemente un video educativo. " +
            (groundedInTranscript
              ? "Básate estrictamente en la transcripción provista, no inventes datos fuera de ella."
              : "No hay transcripción disponible: sé conservador, marca claramente qué es un resumen general del tema y evita afirmaciones muy específicas.") +
            " " +
            localeInstruction(locale),
        },
        {
          role: "user",
          content: `Nodo: ${nodeTitle}\nResumen: ${nodeSummary}\n\nTranscripción:\n${videoTranscript ?? "(no disponible)"}`,
        },
      ],
    });

    return { markdown: completion.choices[0]?.message?.content ?? "", groundedInTranscript };
  }

  async generateChallenge({ nodeTitle, nodeSummary, contentType, locale, videoTranscript }: GenerateChallengeInput): Promise<Challenge> {
    const jsonSchema = CHALLENGE_JSON_SCHEMA_BY_TYPE[contentType];
    const needsMultipleItems = contentType === "factual" || contentType === "language";
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            (needsMultipleItems
              ? `Genera exactamente ${MIN_QUESTIONS_PER_CHALLENGE} preguntas de práctica de tipo "${contentType}" para validar que el usuario aprendió el contenido del nodo. ` +
                "Varía la dificultad y el ángulo de cada pregunta (no repitas la misma idea reformulada) para cubrir el tema con profundidad real."
              : contentType === "procedural"
                ? "Genera un reto de código. IMPORTANTE: `language` debe ser siempre \"javascript\" (es el único lenguaje que el sandbox actual puede ejecutar, sin excepción). " +
                  "`testCode` se ejecuta en el mismo scope que el código del usuario (puede llamar directo a sus funciones/variables) y DEBE lanzar `throw new Error(\"mensaje claro\")` si una aserción falla; si todas pasan, no debe lanzar nada. No uses ninguna librería externa de testing (no jest/chai/etc), solo JS plano con `if` + `throw`."
                : `Genera un reto práctico de tipo "${contentType}" para validar que el usuario aprendió el contenido del nodo.`) +
            " " +
            localeInstruction(locale),
        },
        {
          role: "user",
          content: `Nodo: ${nodeTitle}\nResumen: ${nodeSummary}\nTranscripción:\n${videoTranscript ?? "(no disponible)"}`,
        },
      ],
      response_format: { type: "json_schema", json_schema: jsonSchema as any },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error(`${this.name}: no devolvió contenido para el reto`);
    return ChallengeSchema.parse({ ...JSON.parse(raw), kind: challengeKindFor(contentType), contentType });
  }

  async gradeOpenResponse({ prompt, rubric, userResponse }: GradeOpenResponseInput): Promise<GradeResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Eres un evaluador estricto pero justo. Califica la respuesta del usuario contra la rúbrica dada. " +
            'Responde SOLO JSON: {"passed": boolean, "score": number 0-100, "feedback": string}.',
        },
        { role: "user", content: `Consigna: ${prompt}\nRúbrica: ${rubric}\nRespuesta del usuario: ${userResponse}` },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0]?.message?.content ?? "{}") as GradeResult;
  }
}

function localeInstruction(locale: LocaleCode): string {
  return (
    `Escribe todo el texto (títulos, resúmenes, explicaciones, preguntas) en ${LOCALE_NAMES[locale]}. ` +
    "Excepción: si el tema pide aprender otro idioma específico (ej. vocabulario o frases en un idioma distinto), " +
    "ese contenido puntual (la palabra/frase a aprender) queda en el idioma que el tema pide, pero las instrucciones alrededor siguen en el idioma indicado arriba."
  );
}

function challengeKindFor(contentType: GenerateChallengeInput["contentType"]) {
  switch (contentType) {
    case "procedural":
      return "code" as const;
    case "factual":
      return "quiz" as const;
    case "language":
      return "flashcard" as const;
    case "creative":
      return "open_response" as const;
  }
}
