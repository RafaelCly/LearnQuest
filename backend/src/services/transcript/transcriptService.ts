import { YoutubeTranscript } from "youtube-transcript";
import type { LocaleCode } from "../../schemas/locale.js";

/**
 * Obtiene la transcripción de un video para generar el documento complementario
 * y el reto ANCLADOS al contenido real (no al título del nodo).
 *
 * Usa `youtube-transcript` (scraping de los captions públicos que ya expone el
 * reproductor web de YouTube, sin API key). No hay endpoint oficial para bajar
 * captions de videos de terceros sin ser su dueño -- esto es lo mejor
 * disponible sin eso. Puede fallar (video sin captions, captions desactivados,
 * o YouTube cambia algo internamente) — en cualquier caso se degrada a `null`
 * explícitamente en vez de reventar la generación del documento/reto.
 */
export async function fetchTranscript(videoId: string, preferredLocale: LocaleCode): Promise<string | null> {
  // Primero intenta el idioma de la ruta; si ese track de captions no existe
  // (video en otro idioma, o no tiene esa pista), reintenta sin idioma
  // preferido -- cualquier transcripción real sigue siendo mejor que ninguna,
  // el LLM que la consume puede trabajar con texto en otro idioma igual.
  const segments = (await tryFetch(videoId, preferredLocale)) ?? (await tryFetch(videoId));
  if (!segments) return null;

  const text = segments.map((s) => s.text).join(" ").trim();
  return text.length > 0 ? text : null;
}

async function tryFetch(videoId: string, lang?: string) {
  try {
    return await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined);
  } catch (err) {
    console.warn(
      `Sin transcripción disponible para el video ${videoId}${lang ? ` (lang=${lang})` : ""}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
