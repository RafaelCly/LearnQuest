// Estos tipos reflejan el contrato de backend/src/controllers/routes.controller.ts
// (toRouteView). Si el backend cambia la forma de respuesta, este archivo es
// el único lugar que hay que actualizar en el frontend.

export type ContentType = "procedural" | "factual" | "language" | "creative";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type NodeStatus = "locked" | "active" | "completed";

export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  durationSeconds: number;
  viewCount: number;
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
