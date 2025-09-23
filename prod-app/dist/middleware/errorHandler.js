"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInternalServerError = exports.createBadRequestError = exports.createForbiddenError = exports.createUnauthorizedError = exports.createConflictError = exports.createNotFoundError = exports.createValidationError = exports.createError = exports.asyncErrorHandler = exports.errorHandler = exports.CustomError = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
/**
 * Clase para errores personalizados de la aplicación
 */
class CustomError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
/**
 * Middleware de manejo de errores centralizado
 */
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Error interno del servidor';
    let details = null;
    console.error('🔴 ERROR HANDLER:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        user: req.user?.id
    });
    // Errores de validación Zod
    if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Error de validación';
        details = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
        }));
    }
    // Errores de Prisma
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
exports.errorHandler = errorHandler;
/**
 * Middleware para capturar errores asíncronos
 */
const asyncErrorHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncErrorHandler = asyncErrorHandler;
/**
 * Función helper para crear errores personalizados
 */
const createError = (message, statusCode = 500) => {
    return new CustomError(message, statusCode);
};
exports.createError = createError;
/**
 * Función helper para errores de validación
 */
const createValidationError = (message) => {
    return new CustomError(message, 400);
};
exports.createValidationError = createValidationError;
/**
 * Función helper para errores de no encontrado
 */
const createNotFoundError = (message = 'Recurso no encontrado') => {
    return new CustomError(message, 404);
};
exports.createNotFoundError = createNotFoundError;
/**
 * Función helper para errores de conflicto
 */
const createConflictError = (message) => {
    return new CustomError(message, 409);
};
exports.createConflictError = createConflictError;
/**
 * Función helper para errores de autorización
 */
const createUnauthorizedError = (message = 'No autorizado') => {
    return new CustomError(message, 401);
};
exports.createUnauthorizedError = createUnauthorizedError;
/**
 * Función helper para errores de permisos
 */
const createForbiddenError = (message = 'Acceso denegado') => {
    return new CustomError(message, 403);
};
exports.createForbiddenError = createForbiddenError;
const createBadRequestError = (message = 'Solicitud incorrecta') => {
    return new CustomError(message, 400);
};
exports.createBadRequestError = createBadRequestError;
const createInternalServerError = (message = 'Error interno del servidor') => {
    return new CustomError(message, 500);
};
exports.createInternalServerError = createInternalServerError;
