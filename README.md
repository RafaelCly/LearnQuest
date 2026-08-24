# LearnQuest — Rutas de Aprendizaje Gamificadas

MVP de una plataforma que genera rutas de aprendizaje interactivas: dado un
tema, una IA arma la malla curricular (árbol de habilidades), se puebla cada
nodo con el mejor video de YouTube, un documento complementario generado
desde la transcripción del video, y un reto práctico adaptado al tipo de
contenido (código, quiz, flashcards).

Contexto y decisiones de producto: ver [`rutas-aprendizaje-gamificadas.pdf`](./rutas-aprendizaje-gamificadas.pdf)
(one-pager de la idea ya refinada).

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4 + React Flow + TanStack Query.
- **Backend**: Express + TypeScript, proveedor de IA intercambiable (Azure AI
  Foundry / OpenAI, ver `backend/src/services/llm`).
- **Datos**: Supabase (Postgres) para rutas y progreso; cae a memoria en dev
  local si no hay credenciales configuradas.
- **Video**: YouTube Data API v3.

## Por qué el proveedor de IA es intercambiable

El free trial de Azure AI Foundry es temporal (crédito limitado). Todo el
backend habla contra la interfaz `LLMProvider`
(`backend/src/services/llm/types.ts`) — nunca importa el SDK de Azure/OpenAI
directamente fuera de `services/llm/providers`. Cambiar de proveedor es una
variable de entorno (`LLM_PROVIDER=azure|openai`), no un cambio de código.

## Estructura

```
backend/
  src/
    config/       # validación de env vars (zod)
    schemas/      # contratos: malla curricular y retos (zod + JSON Schema para Structured Outputs)
    services/
      llm/        # interfaz LLMProvider + providers/ (azure, openai)
      youtube/    # búsqueda y ranking de videos (sin IA, heurístico)
      transcript/ # transcripción de video (stub, ver TODO)
      curriculum/ # orquestador: genera malla + puebla videos; documento on-demand
      challenges/ # genera y califica retos por tipo de contenido
    repositories/ # persistencia (interfaz + InMemory + Supabase)
    controllers/, routes/, middleware/, app.ts, server.ts
frontend/
  src/
    components/
      SkillTree/    # React Flow: layout vertical, nodo custom con estados
      NodeDetail/    # panel de video + documento + reto (dispatch por tipo)
    lib/api.ts       # cliente HTTP tipado contra el backend
    types/route.ts   # espejo de los contratos del backend
```

## Cómo correrlo

```bash
# Backend
cd backend
cp .env.example .env   # completa tus credenciales
npm install
npm run dev             # http://localhost:4000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173 (con proxy a /api -> :4000)
```

## Estado del MVP

Ver el one-pager para el detalle de alcance. Resumen:

- ✅ Generación de malla + videos, documento y reto on-demand por nodo.
- ✅ Retos tipo `factual` (quiz) y `language` (flashcard): mínimo 10 preguntas
  por nodo, recorridas una por una, con auto-calificación barata (comparación
  directa, sin gastar IA) y umbral de 70% para completar el nodo.
- ✅ Reto tipo `procedural` (código): se ejecuta de verdad contra `testCode`
  en un sandbox `node:vm` con timeout (`backend/src/services/sandbox/jsSandbox.ts`).
  **No es un sandbox aislado de verdad** (limitación de `node:vm` documentada
  en el propio código) — aceptable para MVP personal de bajo tráfico, hay que
  reemplazarlo por un sandbox real antes de exponerlo a usuarios externos.
  Por ahora solo soporta JavaScript.
- ⏸️ Reto tipo `creative` (LLM-como-juez): fuera de alcance del MVP a propósito.
- 🚧 Transcripción real de YouTube: `transcriptService.ts` es un stub — hoy el
  documento/reto se genera sin transcripción (degradado, marcado como tal en
  el frontend) hasta que se valide una librería de captions confiable.
