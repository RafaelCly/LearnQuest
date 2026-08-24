// Estos tipos reflejan el contrato de backend/src/controllers/routes.controller.ts
// (toRouteView). Si el backend cambia la forma de respuesta, este archivo es
// el único lugar que hay que actualizar en el frontend.

export type ContentType = "procedural" | "factual" | "language" | "creative";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type NodeStatus = "locked" | "active" | "completed";

/** Idioma del contenido generado (no confundir con el lenguaje de programación de un reto de código). */
export type LocaleCode = "es" | "en" | "fr" | "pt" | "de" | "it";

export const LOCALE_OPTIONS: { value: LocaleCode; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  url: string;
}

export interface RouteNode {
  id: string;
  title: string;
  summary: string;
  contentType: ContentType;
  difficulty: Difficulty;
  searchQuery: string;
  prerequisites: string[];
  estimatedMinutes: number;
  status: NodeStatus;
  video: VideoResult | null;
}

export interface RouteView {
  id: string;
  locale: LocaleCode;
  topic: string;
  title: string;
  description: string;
  nodes: RouteNode[];
  progress: {
    completedNodeIds: string[];
    percent: number;
  };
}

export interface NodeDocument {
  markdown: string;
  groundedInTranscript: boolean;
}

export interface PublicQuizItem {
  prompt: string;
  options: string[];
}

export interface PublicFlashcardItem {
  prompt: string;
}

export type PublicChallenge =
  | { kind: "code"; contentType: "procedural"; prompt: string; language: string; starterCode: string }
  | { kind: "quiz"; contentType: "factual"; items: PublicQuizItem[] }
  | { kind: "flashcard"; contentType: "language"; items: PublicFlashcardItem[] }
  | { kind: "open_response"; contentType: "creative"; prompt: string; rubric: string };

export interface ItemResult {
  correct: boolean;
  explanationOrExpected: string;
}

export interface GradeResult {
  passed: boolean;
  score: number;
  feedback: string;
  itemResults?: ItemResult[];
}

export interface SubmitChallengeResponse {
  grade: GradeResult;
  progress: { completedNodeIds: string[]; percent: number };
}
