import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`LearnQuest backend escuchando en http://localhost:${env.PORT}`);
});

// Vercel importa este módulo y usa el default export como la función
// serverless (Fluid Compute) — no reescribe rutas, envuelve la app entera.
// El app.listen() de arriba es inofensivo ahí, solo se usa en local/tsx.
export default app;
