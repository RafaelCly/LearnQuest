import { env } from "../../config/env.js";
import type { LocaleCode } from "../../schemas/locale.js";

export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string;
  url: string;
}

export interface NodeVideo extends VideoResult {
  /**
   * Siguientes mejores candidatos del mismo ranking, además del elegido.
   * No cuesta cuota extra de YouTube: ya venían en la misma búsqueda, antes
   * se descartaban todos menos el primero.
   */
  alternates: VideoResult[];
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Busca y rankea el mejor video para una searchQuery de nodo. La curación NO
 * usa IA (sería gastar presupuesto de LLM en algo que un heurístico resuelve
 * gratis): se apoya en duración + vistas + antigüedad para evitar basura SEO.
 */
export async function findBestVideoForNode(searchQuery: string, locale: LocaleCode): Promise<NodeVideo | null> {
  if (!env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY no configurada");
  }

  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("key", env.YOUTUBE_API_KEY);
  searchUrl.searchParams.set("q", searchQuery);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("relevanceLanguage", locale);
  searchUrl.searchParams.set("safeSearch", "strict");

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube search falló: ${searchRes.status} ${await searchRes.text()}`);
  }
  // La respuesta de un tercero es datos no confiables: se valida su forma antes de usarla.
  const searchJson = (await searchRes.json()) as YouTubeSearchResponse;
  const videoIds = searchJson.items?.map((item) => item.id?.videoId).filter(Boolean) as string[] | undefined;
  if (!videoIds || videoIds.length === 0) return null;

  const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  statsUrl.searchParams.set("key", env.YOUTUBE_API_KEY);
  statsUrl.searchParams.set("id", videoIds.join(","));
  statsUrl.searchParams.set("part", "snippet,contentDetails,statistics");

  const statsRes = await fetch(statsUrl);
  if (!statsRes.ok) {
    throw new Error(`YouTube videos.list falló: ${statsRes.status} ${await statsRes.text()}`);
  }
  const statsJson = (await statsRes.json()) as YouTubeVideosResponse;
  if (!statsJson.items || statsJson.items.length === 0) return null;

  const candidates = statsJson.items.map(toVideoResult).filter(isReasonableTutorial);
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => rankScore(b) - rankScore(a));
  const [best, ...rest] = candidates;
  if (!best) return null;
  return { ...best, alternates: rest.slice(0, 2) };
}

function toVideoResult(item: YouTubeVideoItem): VideoResult {
  return {
    videoId: item.id,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    durationSeconds: parseIsoDuration(item.contentDetails.duration),
    viewCount: Number(item.statistics.viewCount ?? "0"),
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id}`,
  };
}

// Filtra shorts y streams maratónicos poco útiles como "lección" de un nodo.
function isReasonableTutorial(video: VideoResult): boolean {
  return video.durationSeconds >= 120 && video.durationSeconds <= 3600;
}

function rankScore(video: VideoResult): number {
  // log de vistas para no dejar que un solo video viral aplaste al resto,
  // con una banda de duración "dulce" (5-25 min) preferida para contenido educativo.
  const viewScore = Math.log10(video.viewCount + 1);
  const sweetSpot = video.durationSeconds >= 300 && video.durationSeconds <= 1500 ? 1.2 : 1;
  // Empuja contenido reciente sin castigar clásicos evergreen con muchas vistas:
  // 1.15x a los 0 años, baja ~3%/año, piso en 0.75x (nunca invalida un video top por viejo).
  const ageYears = (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const recencyFactor = Math.max(0.75, 1.15 - ageYears * 0.03);
  return viewScore * sweetSpot * recencyFactor;
}

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h ?? 0) * 3600) + (Number(m ?? 0) * 60) + Number(s ?? 0);
}

interface YouTubeSearchResponse {
  items?: Array<{ id?: { videoId?: string } }>;
}

interface YouTubeVideoItem {
  id: string;
  snippet: { title: string; channelTitle: string; publishedAt: string };
  contentDetails: { duration: string };
  statistics: { viewCount?: string };
}

interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[];
}
