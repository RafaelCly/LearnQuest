import axios from "axios";
import type {
  RouteView,
  NodeDocument,
  PublicChallenge,
  SubmitChallengeResponse,
} from "../types/route";

// En local, "/api" pasa por el proxy de Vite (vite.config.ts) hacia
// localhost:4000. En producción no hay ese proxy -- VITE_API_BASE_URL debe
// apuntar a la URL pública del backend (ver frontend/.env.example).
const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

// El backend responde siempre { error: { code, message, details? } } —
// normalizamos a un Error con ese mensaje para que los componentes no
// tengan que conocer la forma de la respuesta de error.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error?.message ?? "Error de red inesperado";
    return Promise.reject(new Error(message));
  }
);

export async function generateRoute(topic: string, targetLevel?: string): Promise<RouteView> {
  const { data } = await client.post<RouteView>("/routes", { topic, targetLevel });
  return data;
}

export async function fetchRoute(routeId: string): Promise<RouteView> {
  const { data } = await client.get<RouteView>(`/routes/${routeId}`);
  return data;
}

export async function fetchNodeDocument(routeId: string, nodeId: string): Promise<NodeDocument> {
  const { data } = await client.get<NodeDocument>(`/routes/${routeId}/nodes/${nodeId}/document`);
  return data;
}

export async function fetchNodeChallenge(routeId: string, nodeId: string): Promise<PublicChallenge> {
  const { data } = await client.get<PublicChallenge>(`/routes/${routeId}/nodes/${nodeId}/challenge`);
  return data;
}

export interface ChallengeSubmission {
  quizAnswers?: number[];
  flashcardAnswers?: string[];
  codeSubmission?: string;
  openResponseText?: string;
}

export async function submitChallenge(
  routeId: string,
  nodeId: string,
  submission: ChallengeSubmission
): Promise<SubmitChallengeResponse> {
  const { data } = await client.post<SubmitChallengeResponse>(
    `/routes/${routeId}/nodes/${nodeId}/challenge/submit`,
    submission
  );
  return data;
}
