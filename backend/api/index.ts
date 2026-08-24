import { createApp } from "../src/app.js";

// Entrada explícita para Vercel Functions: un único function catch-all
// (ver backend/vercel.json) que envuelve la app Express entera, en vez de
// reescribir cada endpoint como un handler individual.
export default createApp();
