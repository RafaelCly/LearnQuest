import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  LLM_PROVIDER: z.enum(["azure", "openai", "gemini"]).default("azure"),

  AZURE_AI_FOUNDRY_ENDPOINT: z.string().optional(),
  AZURE_AI_FOUNDRY_API_KEY: z.string().optional(),
  AZURE_AI_FOUNDRY_DEPLOYMENT: z.string().default("gpt-4o-mini"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  YOUTUBE_API_KEY: z.string().optional(),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

// Falla rápido y con un mensaje claro si falta configuración crítica,
// en vez de que el error aparezca a medias en un service tres llamadas después.
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Configuración de entorno inválida:", parsed.error.flatten().fieldErrors);
  throw new Error("Revisa tu archivo .env contra .env.example");
}

export const env = parsed.data;
