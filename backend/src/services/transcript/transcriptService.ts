/**
 * Obtiene la transcripción de un video para generar el documento complementario
 * y el reto ANCLADOS al contenido real (no al título del nodo, ver decisión en
 * el one-pager de la idea).
 *
 * TODO: implementar con una librería de captions (ej. youtube-caption-extractor)
 * o timedtext scraping. Es un supuesto sin validar todavía (no todos los videos
 * tienen transcripción decente) — por eso toda la cadena de generación (doc,
 * reto) está diseñada para aceptar `null` y degradar explícitamente en vez de
 * fallar o inventar contenido como si viniera del video.
 */
export async function fetchTranscript(_videoId: string): Promise<string | null> {
  return null;
}
