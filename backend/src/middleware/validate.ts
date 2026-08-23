import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

/**
 * Valida SOLO en el límite del sistema (route handler). El resto del código
 * confía en los tipos ya validados — ver api-and-interface-design.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
