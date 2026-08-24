import type { Curriculum } from "../../schemas/curriculum.schema.js";
import type { Challenge, ContentType } from "../../schemas/challenge.schema.js";
import type { LocaleCode } from "../../schemas/locale.js";
import type { SearchResult } from "../search/tavilySearchService.js";

/**
 * Contrato único para cualquier proveedor de IA. El resto del backend habla
 * SOLO con esta interfaz — nunca importa el SDK de Azure/OpenAI directamente
 * fuera de services/llm/providers. Esto es lo que permite cambiar de Azure AI
 * Foundry a OpenAI (o Gemini) sin tocar controllers ni services.
 */
export interface LLMProvider {
  readonly name: string;

  generateCurriculum(input: GenerateCurriculumInput): Promise<Curriculum>;

  generateNodeDocument(input: GenerateDocumentInput): Promise<NodeDocument>;

  generateChallenge(input: GenerateChallengeInput): Promise<Challenge>;

  gradeOpenResponse(input: GradeOpenResponseInput): Promise<GradeResult>;
}

export interface GenerateCurriculumInput {
  topic: string;
  /** Idioma en el que debe salir todo el contenido generado (títulos, resúmenes, preguntas). */
  locale: LocaleCode;
  /** Nivel deseado por el usuario, si lo indicó */
  targetLevel?: "beginner" | "intermediate" | "advanced";
  /** Máximo de nodos, para controlar costo (default aplicado en el service) */
  maxNodes?: number;
}

export interface GenerateDocumentInput {
  nodeTitle: string;
  nodeSummary: string;
  locale: LocaleCode;
  /** Transcripción real del video (o null si no está disponible) */
  videoTranscript: string | null;
  /** Fuentes reales encontradas por búsqueda web (array vacío si Tavily no está configurado) */
  relatedSources: SearchResult[];
}

export interface NodeDocument {
  markdown: string;
  /** true si se generó sin transcripción (menor confiabilidad, se lo decimos al usuario) */
  groundedInTranscript: boolean;
}

export interface GenerateChallengeInput {
  nodeTitle: string;
  nodeSummary: string;
  contentType: ContentType;
  locale: LocaleCode;
  videoTranscript: string | null;
}

export interface GradeOpenResponseInput {
  prompt: string;
  rubric: string;
  userResponse: string;
}

export interface GradeResult {
  passed: boolean;
  score: number; // 0-100
  feedback: string;
}
