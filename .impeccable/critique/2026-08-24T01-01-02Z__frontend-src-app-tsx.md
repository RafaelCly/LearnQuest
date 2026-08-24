---
target: frontend (LearnQuest UI)
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
timestamp: 2026-08-24T01-01-02Z
slug: frontend-src-app-tsx
---
Method: dual-agent (A: a2e25eeb34c08d015 · B: a46fd0dfb6d6e4b92)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 10-20s de generación sin feedback visual (solo el texto del botón cambia) |
| 2 | Match System / Real World | 3 | Iconos y labels legibles y en el dominio correcto |
| 3 | User Control and Freedom | 1 | No hay forma de volver a buscar otro tema sin refrescar la página |
| 4 | Consistency and Standards | 3 | Tokens de Tailwind aplicados de forma uniforme |
| 5 | Error Prevention | 2 | Input de tema sin guía ni validación antes de comprometerse a una espera larga |
| 6 | Recognition Rather Than Recall | 1 | Títulos de nodo truncados sin `title` attribute; nodos bloqueados no explican por qué |
| 7 | Flexibility and Efficiency | 1 | Sin atajos, sin búsqueda/salto entre nodos |
| 8 | Aesthetic and Minimalist Design | 2 | Limpio pero genérico: tarjetas planas uniformes, un solo color de acento para todo |
| 9 | Error Recovery | 2 | Error de generación se muestra pero sin botón de reintentar |
| 10 | Help and Documentation | 0 | Cero leyenda/tooltip explicando bloqueado/activo/completado o los íconos de tipo de contenido |
| **Total** | | **17/40** | **Poor — MVP funcional pero con huecos estructurales** |

#### Design Specificity Verdict

**No es específico.** El propio comentario en `index.css` admite que la estética salió de un prompt genérico ("developer tool skill tree gamified dark mode adult") — y se nota. Bloqueado/activo/completado son 3 variantes de color de borde sobre el mismo rectángulo redondeado; las conexiones son las líneas grises default de React Flow; no hay metáfora de camino/ruta/quest en ningún lado pese a que el producto se llama "LearnQuest". Cambia el texto a inglés y esto podría ser un visor de DAGs de Airflow sin perder nada de identidad — exactamente el "se ve chusco" que describiste.

**Scan determinístico:** 1 hallazgo en CLI (`overused-font` en index.css, Inter como única fuente — real, no falso positivo). En navegador, sobre la vista del árbol generado: **33 anti-patrones**, los más severos:
- `low-contrast` ×12 — texto de nodos bloqueados a 3.3:1 (necesita 4.5:1 AA). Confirmado: `#64748b` sobre `#1a2333`.
- `nested-cards` ×10 — tarjetas de nodo dentro del panel del canvas (efecto "caja dentro de caja").
- `clipped-overflow-container` ×3 — tres contenedores `overflow-hidden` anidados alrededor del canvas.
- `dark-glow` ×1 y dos hallazgos de tipografía (posible intencional para gamificación, pero vale la pena revisar igual).

#### Overall Impression

Funciona técnicamente pero no *se siente* como un juego. El momento de mayor impacto emocional — completar un nodo — pasa casi desapercibido.

#### What's Working
1. **Sistema de estados de `SkillNode.tsx`** (candado / ícono de tipo / check) — buena base, solo subdesarrollada.
2. **`layout.ts`** — el algoritmo de niveles topológicos maneja bien un grafo de prerequisitos generado por IA, incluso con corte de ciclos accidentales.
3. **`ProgressBar.tsx`** — accesibilidad correcta (`role="progressbar"`, `aria-valuenow/min/max`) y `tabular-nums` para evitar jitter.

#### Priority Issues

- **[P0] El canvas colapsa a ancho 0 en móvil cuando el panel está abierto.** Medido en 480px: el árbol queda literalmente invisible en cuanto seleccionas un nodo. → `/impeccable adapt`
- **[P1] Cero feedback durante los 10-20s de generación.** Solo cambia el texto del botón. → `/impeccable animate` + `/impeccable delight`
- **[P2] La recompensa de completar un nodo no se siente.** El mensaje de éxito es texto plano en el panel, mientras el cambio real (nodo se pone verde, siguiente se desbloquea) pasa en el otro panel, fuera del foco del usuario. → `/impeccable delight`
- **[P3] Identidad visual genérica de "dev tool oscuro cualquiera".** Un solo color de acento para todo, sin metáfora de camino, pantalla inicial sin preview de cómo se ve el árbol. → `/impeccable colorize` + redesign del árbol
- **[P3] Títulos truncados sin tooltip y sin leyenda de estados en ningún lado.** → `/impeccable clarify`

#### Persona Red Flags

**Jordan (primera vez):** nada explica bloqueado/activo/completado antes de la espera de 10-20s; el mensaje de éxito es tan sutil que puede no registrar que "ganó" algo.
**Alex (usuario impaciente):** no hay forma de volver a buscar otro tema sin refrescar la página; sin atajos ni búsqueda entre nodos.

#### Minor Observations
- Contraste de texto en nodos bloqueados: 3.31:1 (falla AA).
- `CodeChallenge.tsx` es un `<textarea>` plano sin resaltado de sintaxis.
- Estado vacío de "sin video" es texto plano sin ícono.
- Errores del backend se muestran verbatim sin botón de reintentar.

#### Questions to Consider
1. Si los nodos bloqueados no explican por qué lo están, ¿cómo distingue un usuario nuevo esto de un diagrama de flujo con colores aleatorios?
2. El producto se llama "LearnQuest" — ¿dónde se siente algo de "quest" (rachas, niveles, sonido, movimiento) hoy?
