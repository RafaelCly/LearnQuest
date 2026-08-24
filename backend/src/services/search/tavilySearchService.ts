import { env } from "../../config/env.js";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

/**
 * Busca fuentes reales relacionadas a un nodo para que el documento
 * complementario cite lecturas de verdad (con URL real) en vez de que la IA
 * "invente" referencias con pinta de cita académica pero sin link real detrás.
 *
 * Servicio opcional a propósito: sin TAVILY_API_KEY configurada, retorna un
 * array vacío en vez de lanzar — el documento se sigue generando igual, solo
 * sin esa sección.
 */
export async function searchRelatedSources(query: string): Promise<SearchResult[]> {
  if (!env.TAVILY_API_KEY) return [];

  try {
    const res = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_results: 4,
        search_depth: "basic",
      }),
    });

    if (!res.ok) {
      console.warn(`Tavily search falló (${res.status}): ${await res.text()}`);
      return [];
    }

    // Respuesta de un tercero: no confiar en la forma, validar antes de usar.
    const data = (await res.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
    if (!Array.isArray(data.results)) return [];

    return data.results
      .filter((r): r is { title: string; url: string; content?: string } => Boolean(r.title && r.url))
      .map((r) => ({ title: r.title, url: r.url, snippet: (r.content ?? "").slice(0, 300) }));
  } catch (err) {
    console.warn("Tavily search falló:", err instanceof Error ? err.message : err);
    return [];
  }
}
