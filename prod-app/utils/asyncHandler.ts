/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * ===========================================
 * ASYNC HANDLER ENTERPRISE - TIPO SAFE
 * ===========================================
 * 
 * Sistema robusto de manejo de errores asíncronos
 * con tipos seguros y escalabilidad enterprise
 */

/**
 * Handler principal - compatible con todos los controladores
 */
export function asyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handler para rutas autenticadas - con validación de usuario
 */
export function authenticatedAsyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }
    
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handler para rutas públicas - sin autenticación
 */
export function publicAsyncHandler<T = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}