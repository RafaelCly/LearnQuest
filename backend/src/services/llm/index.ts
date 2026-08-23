import { env } from "../../config/env.js";
import type { LLMProvider } from "./types.js";
import { AzureFoundryProvider } from "./providers/azureFoundryProvider.js";
import { OpenAIProvider } from "./providers/openAIProvider.js";

let cached: LLMProvider | null = null;

/**
 * Punto único donde se decide qué proveedor de IA está activo (env LLM_PROVIDER).
 * El resto del backend nunca debe importar un provider concreto directamente.
 */
export function getLLMProvider(): LLMProvider {
  if (cached) return cached;

  switch (env.LLM_PROVIDER) {
    case "azure":
      cached = new AzureFoundryProvider();
      break;
    case "openai":
      cached = new OpenAIProvider();
      break;
    case "gemini":
      // TODO: agregar GeminiProvider (tier gratuito) como respaldo del respaldo
      // cuando se agote el crédito de OpenAI. Debe implementar la misma
      // interfaz LLMProvider — ver providers/openAIProvider.ts como referencia.
      throw new Error("LLM_PROVIDER=gemini todavía no está implementado");
    default:
      throw new Error(`LLM_PROVIDER desconocido: ${env.LLM_PROVIDER}`);
  }

  return cached;
}
