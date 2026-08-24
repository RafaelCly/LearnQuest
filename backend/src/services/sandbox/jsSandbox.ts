import vm from "node:vm";

/**
 * Ejecuta el código del usuario + testCode en un contexto vm de Node.
 *
 * ADVERTENCIA DE SEGURIDAD: `node:vm` NO es un sandbox real — es un contexto
 * de ejecución separado, pero hay formas conocidas de escaparlo (acceder al
 * proceso host vía el prototipo de constructor, etc.). Es aceptable acá SOLO
 * porque este es un MVP personal de bajo tráfico donde el propio desarrollador
 * es quien corre sus propios retos generados. Antes de exponer esto a
 * usuarios externos reales, esto DEBE reemplazarse por un sandbox aislado de
 * verdad (contenedor descartable, microVM, o un servicio tipo Vercel Sandbox).
 */

export interface SandboxResult {
  passed: boolean;
  output: string[];
  error: string | null;
}

const TIMEOUT_MS = 2000;

export function runJavaScriptInSandbox(userCode: string, testCode: string): SandboxResult {
  const output: string[] = [];
  const sandboxConsole = {
    log: (...args: unknown[]) => output.push(args.map(String).join(" ")),
  };
  const context = vm.createContext({ console: sandboxConsole });

  try {
    // El testCode se ejecuta en el mismo scope que el código del usuario
    // (así puede referenciar directamente sus funciones/variables) y debe
    // lanzar un Error con mensaje claro si una aserción falla — es la
    // convención que se le pide a la IA al generar el reto.
    const script = new vm.Script(`${userCode}\n;(function () {\n${testCode}\n})();`, {
      filename: "challenge.js",
    });
    script.runInContext(context, { timeout: TIMEOUT_MS });
    return { passed: true, output, error: null };
  } catch (err) {
    return { passed: false, output, error: err instanceof Error ? err.message : String(err) };
  }
}
