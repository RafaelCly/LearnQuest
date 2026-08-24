import OpenAI from "openai";
import { env } from "../../../config/env.js";
import { BaseChatCompletionsProvider } from "./baseChatProvider.js";

/**
 * Proveedor para el free trial de Azure AI Foundry.
 *
 * Los proyectos nuevos de AI Foundry (portal ai.azure.com) exponen la
 * superficie "v1" unificada de OpenAI en `<endpoint>/openai/v1` — SIN el
 * query param `api-version` de la Azure OpenAI clásica (usarlo ahí da
 * "api-version query parameter is not allowed when using /v1 path").
 * Por eso NO se usa el cliente `AzureOpenAI` del SDK (que exige apiVersion),
 * sino el cliente `OpenAI` genérico apuntando su baseURL a esa ruta v1
 * — confirmado con Bearer auth funcionando igual que la api-key clásica.
 */
export class AzureFoundryProvider extends BaseChatCompletionsProvider {
  readonly name = "azure";
  protected client: OpenAI;
  protected model: string;

  constructor() {
    super();
    if (!env.AZURE_AI_FOUNDRY_ENDPOINT || !env.AZURE_AI_FOUNDRY_API_KEY) {
      throw new Error(
        "AZURE_AI_FOUNDRY_ENDPOINT y AZURE_AI_FOUNDRY_API_KEY son requeridos cuando LLM_PROVIDER=azure"
      );
    }
    this.client = new OpenAI({
      apiKey: env.AZURE_AI_FOUNDRY_API_KEY,
      baseURL: `${env.AZURE_AI_FOUNDRY_ENDPOINT.replace(/\/$/, "")}/openai/v1`,
    });
    this.model = env.AZURE_AI_FOUNDRY_DEPLOYMENT;
  }
}
