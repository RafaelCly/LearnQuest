import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/httpError.js";
import { NotFoundError } from "../repositories/routeRepository.js";

/**
 * Único formato de error en toda la API: { error: { code, message, details? } }.
 * Nunca mezclamos "a veces throw, a veces {error}, a veces null" — un solo
 * contrato para que el frontend pueda manejarlo de forma predecible.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: err.message } });
  }

  if (isValidationShape(err)) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Algo salió mal. Intenta de nuevo." },
  });
}

function isValidationShape(err: unknown): err is { statusCode: number; code: string; message: string; details?: unknown } {
  return typeof err === "object" && err !== null && "statusCode" in err && "code" in err;
}
