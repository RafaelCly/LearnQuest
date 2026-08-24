import { z } from "zod";

/**
 * Idioma en el que se genera el contenido de la ruta (títulos, documentos,
 * preguntas, y el relevanceLanguage de la búsqueda en YouTube). No confundir
 * con `Challenge.language` (schemas/challenge.schema.ts), que es el lenguaje
 * de PROGRAMACIÓN de un reto de código (ej. "javascript") — son conceptos
 * distintos a propósito, por eso este campo se llama `locale`.
 */
export const LocaleCodeSchema = z.enum(["es", "en", "fr", "pt", "de", "it"]);
export type LocaleCode = z.infer<typeof LocaleCodeSchema>;

export const LOCALE_NAMES: Record<LocaleCode, string> = {
  es: "español",
  en: "English",
  fr: "français",
  pt: "português",
  de: "Deutsch",
  it: "italiano",
};

export const DEFAULT_LOCALE: LocaleCode = "es";
