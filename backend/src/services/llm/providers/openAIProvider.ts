import OpenAI from "openai";
import { env } from "../../../config/env.js";
import { BaseChatCompletionsProvider } from "./baseChatProvider.js";

/**
 * Proveedor de respaldo post free-trial de Azure. Con ~$5 de presupuesto,
 * el modelo por defecto (OPENAI_MODEL) debería quedarse en algo barato como
 * gpt-4o-mini — no lo hardcodeamos para poder subir de tier sin tocar código.
 */
export class OpenAIProvider extends BaseChatCompletionsProvider {
  readonly name = "openai";
  protected client: OpenAI;
  protected model: string;

  constructor() {
    super();
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY es requerido cuando LLM_PROVIDER=openai");
    }
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.model = env.OPENAI_MODEL;
  }
}
