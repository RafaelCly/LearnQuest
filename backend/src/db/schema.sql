-- Esquema inicial para Supabase (Postgres). Ejecutar en el SQL Editor de Supabase
-- o vía `supabase db push` una vez que tengas el CLI conectado.
--
-- Decisión: los nodos/videos/documentos/retos de una ruta se guardan como
-- jsonb en vez de normalizados en tablas propias. Para el MVP (single-user,
-- portafolio) una ruta se genera una vez y rara vez se actualiza campo por
-- campo — normalizar agregaría joins sin beneficio real todavía. Si esto
-- se convierte en multi-usuario/comunidad (ver "Not Doing" del one-pager),
-- ahí sí vale la pena normalizar nodes en su propia tabla.

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  title text not null,
  description text not null,
  nodes jsonb not null,               -- CurriculumNode[]
  videos jsonb not null default '{}', -- Record<nodeId, VideoResult | null>
  documents jsonb not null default '{}', -- Record<nodeId, NodeDocument>
  challenges jsonb not null default '{}', -- Record<nodeId, Challenge>
  created_at timestamptz not null default now()
);

-- Progreso: una fila por ruta en el MVP (sin auth de usuarios todavía).
-- Cuando se agregue Supabase Auth, agregar user_id uuid references auth.users
-- y cambiar la primary key a (route_id, user_id).
create table if not exists route_progress (
  route_id uuid primary key references routes(id) on delete cascade,
  completed_node_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);
