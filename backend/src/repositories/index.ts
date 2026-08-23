import { env } from "../config/env.js";
import { InMemoryRouteRepository, type RouteRepository } from "./routeRepository.js";
import { SupabaseRouteRepository } from "./supabaseRouteRepository.js";
import { createSupabaseClient } from "../db/supabaseClient.js";

// Único punto de swap de persistencia. Sin credenciales de Supabase (dev local
// rápido, o antes de tenerlas configuradas) cae a memoria automáticamente —
// pero avisa por consola para que no sea una sorpresa que el progreso no persiste.
function buildRouteRepository(): RouteRepository {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseRouteRepository(createSupabaseClient());
  }
  console.warn(
    "[repositories] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY no configurados: usando almacenamiento en memoria (se pierde al reiniciar)."
  );
  return new InMemoryRouteRepository();
}

export const routeRepository: RouteRepository = buildRouteRepository();
