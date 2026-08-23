import { AzureOpenAI } from "openai";
import { env } from "../../../config/env.js";
import { BaseChatCompletionsProvider } from "./baseChatProvider.js";

/** Proveedor para el free trial de Azure AI Foundry (7 días de crédito). */
export class AzureFoundryProvider extends BaseChatCompletionsProvider {
  readonly name = "azure";
  protected client: AzureOpenAI;
  protected model: string;

  constructor() {
    super();
    if (!env.AZURE_AI_FOUNDRY_ENDPOINT || !env.AZURE_AI_FOUNDRY_API_KEY) {
      throw new Error(
        "AZURE_AI_FOUNDRY_ENDPOINT y AZURE_AI_FOUNDRY_API_KEY son requeridos cuando LLM_PROVIDER=azure"
      );
    }
    this.client = new AzureOpenAI({
      endpoint: env.AZURE_AI_FOUNDRY_ENDPOINT,
      apiKey: env.AZURE_AI_FOUNDRY_API_KEY,
      deployment: env.AZURE_AI_FOUNDRY_DEPLOYMENT,
      apiVersion: "2024-08-01-preview",
    });
    this.model = env.AZURE_AI_FOUNDRY_DEPLOYMENT;
  }
}
