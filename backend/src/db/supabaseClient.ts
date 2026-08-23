import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Se usa la service_role key porque este cliente vive SOLO en el backend
 * (nunca se expone al frontend) y necesita bypassear RLS para escribir
 * progreso. Cuando se agregue autenticación de usuarios reales, el acceso
 * desde el frontend debe ir con la anon key + RLS, no con esta.
 */
export function createSupabaseClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para usar SupabaseRouteRepository");
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
