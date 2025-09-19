import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Interfaz para errores personalizados
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Clase para errores personalizados de la aplicación
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de manejo de errores centralizado
 */
export const errorHandler = (
  error: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details: any = null;

  console.error('🔴 ERROR HANDLER:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id
  });

  // Errores de validación Zod
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Error de validación';
    details = (error as any).errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }

  // Errores de Prisma
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Conflicto: Ya existe un registro con estos datos';
        details = {
          code: error.code,
          target: error.meta?.target
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Registro no encontrado';
        details = { code: error.code };
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Error de referencia: Datos relacionados no encontrados';
        details = { code: error.code };
        break;
      default:
        statusCode = 400;
        message = 'Error en la base de datos';
        details = { code: error.code };
    }
  }

  // Errores personalizados de la aplicación
  else if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Errores de sintaxis JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido en el body de la request';
  }

  // Errores de autenticación
  else if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
    statusCode = 401;
    message = 'Token de autenticación inválido o expirado';
  }

  // Errores de autorización
  else if (error.message.includes('Acceso denegado') || error.message.includes('permisos')) {
    statusCode = 403;
    message = 'Acceso denegado: No tienes permisos para realizar esta acción';
  }

  // Errores de validación manual
  else if (error.message.includes('Faltan campos requeridos') || error.message.includes('inválido')) {
    statusCode = 400;
    message = error.message;
  }

  // Errores de recursos no encontrados
  else if (error.message.includes('no encontrado') || error.message.includes('no existe')) {
    statusCode = 404;
    message = error.message;
  }

  // Errores de conflicto (duplicados)
  else if (error.message.includes('Ya existe') || error.message.includes('duplicado')) {
    statusCode = 409;
    message = error.message;
  }

  // Respuesta de error
  const errorResponse = {
    error: true,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores asíncronos
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Función helper para crear errores personalizados
 */
export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

/**
 * Función helper para errores de validación
 */
export const createValidationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

/**
 * Función helper para errores de no encontrado
 */
export const createNotFoundError = (message: string = 'Recurso no encontrado'): CustomError => {
  return new CustomError(message, 404);
};

/**
 * Función helper para errores de conflicto
 */
export const createConflictError = (message: string): CustomError => {
  return new CustomError(message, 409);
};

/**
 * Función helper para errores de autorización
 */
export const createUnauthorizedError = (message: string = 'No autorizado'): CustomError => {
  return new CustomError(message, 401);
};

/**
 * Función helper para errores de permisos
 */
export const createForbiddenError = (message: string = 'Acceso denegado'): CustomError => {
  return new CustomError(message, 403);
};

export const createBadRequestError = (message: string = 'Solicitud incorrecta'): CustomError => {
  return new CustomError(message, 400);
};

export const createInternalServerError = (message: string = 'Error interno del servidor'): CustomError => {
  return new CustomError(message, 500);
};
  return new CustomError(message, statusCode);
};

/**
 * Función helper para errores de validación
 */
export const createValidationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

/**
 * Función helper para errores de no encontrado
 */
export const createNotFoundError = (message: string = 'Recurso no encontrado'): CustomError => {
  return new CustomError(message, 404);
};

/**
 * Función helper para errores de conflicto
 */
export const createConflictError = (message: string): CustomError => {
  return new CustomError(message, 409);
};

/**
 * Función helper para errores de autorización
 */
export const createUnauthorizedError = (message: string = 'No autorizado'): CustomError => {
  return new CustomError(message, 401);
};

/**
 * Función helper para errores de permisos
 */
export const createForbiddenError = (message: string = 'Acceso denegado'): CustomError => {
  return new CustomError(message, 403);
};

export const createBadRequestError = (message: string = 'Solicitud incorrecta'): CustomError => {
  return new CustomError(message, 400);
};

export const createInternalServerError = (message: string = 'Error interno del servidor'): CustomError => {
  return new CustomError(message, 500);
};