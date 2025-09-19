import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError, z } from 'zod';

// Extender la interfaz Request para incluir datos validados
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}

/**
 * Middleware de validación usando Zod
 * Valida automáticamente el body, query y params según el schema proporcionado
 */
export const validateRequest = (schema: {
  body?: ZodObject<any>;
  query?: ZodObject<any>;
  params?: ZodObject<any>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData: any = {};

      // Validar body
      if (schema.body) {
        validatedData.body = await schema.body.parseAsync(req.body);
      }

      // Validar query params
      if (schema.query) {
        validatedData.query = await schema.query.parseAsync(req.query);
      }

      // Validar route params
      if (schema.params) {
        validatedData.params = await schema.params.parseAsync(req.params);
      }

      // Guardar datos validados en la request
      req.validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear errores de validación de manera consistente
        const formattedErrors = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        return res.status(400).json({
          error: 'Error de validación',
          details: formattedErrors,
          message: 'Los datos proporcionados no son válidos'
        });
      }

      // Error inesperado
      console.error('Error en middleware de validación:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error procesando la validación'
      });
    }
  };
};

/**
 * Middleware de validación simplificado para solo body
 */
export const validateBody = (schema: ZodObject<any>) => {
  return validateRequest({ body: schema });
};

/**
 * Middleware de validación simplificado para solo query params
 */
export const validateQuery = (schema: ZodObject<any>) => {
  return validateRequest({ query: schema });
};

/**
 * Middleware de validación simplificado para solo route params
 */
export const validateParams = (schema: ZodObject<any>) => {
  return validateRequest({ params: schema });
};

/**
 * Middleware para validar paginación estándar
 */
export const validatePagination = validateQuery;

/**
 * Middleware para validar IDs de UUID
 */
export const validateId = (paramName: string = 'id') => {
  return validateParams(z.object({
    [paramName]: z.string().uuid(`El ${paramName} debe ser un UUID válido`)
  }));
};

/**
 * Función helper para obtener datos validados
 */
export const getValidatedData = (req: Request, key: 'body' | 'query' | 'params' = 'body') => {
  return req.validatedData?.[key];
};

/**
 * Función helper para obtener body validado
 */
export const getValidatedBody = (req: Request) => {
  return getValidatedData(req, 'body');
};

/**
 * Función helper para obtener query validado
 */
export const getValidatedQuery = (req: Request) => {
  return getValidatedData(req, 'query');
};

/**
 * Función helper para obtener params validado
 */
export const getValidatedParams = (req: Request) => {
  return getValidatedData(req, 'params');
};
  };
};

/**
 * Middleware de validación simplificado para solo body
 */
export const validateBody = (schema: ZodObject<any>) => {
  return validateRequest({ body: schema });
};

/**
 * Middleware de validación simplificado para solo query params
 */
export const validateQuery = (schema: ZodObject<any>) => {
  return validateRequest({ query: schema });
};

/**
 * Middleware de validación simplificado para solo route params
 */
export const validateParams = (schema: ZodObject<any>) => {
  return validateRequest({ params: schema });
};

/**
 * Middleware para validar paginación estándar
 */
export const validatePagination = validateQuery;

/**
 * Middleware para validar IDs de UUID
 */
export const validateId = (paramName: string = 'id') => {
  return validateParams(z.object({
    [paramName]: z.string().uuid(`El ${paramName} debe ser un UUID válido`)
  }));
};

/**
 * Función helper para obtener datos validados
 */
export const getValidatedData = (req: Request, key: 'body' | 'query' | 'params' = 'body') => {
  return req.validatedData?.[key];
};

/**
 * Función helper para obtener body validado
 */
export const getValidatedBody = (req: Request) => {
  return getValidatedData(req, 'body');
};

/**
 * Función helper para obtener query validado
 */
export const getValidatedQuery = (req: Request) => {
  return getValidatedData(req, 'query');
};

/**
 * Función helper para obtener params validado
 */
export const getValidatedParams = (req: Request) => {
  return getValidatedData(req, 'params');
};