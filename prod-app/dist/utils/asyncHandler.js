"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.authenticatedAsyncHandler = authenticatedAsyncHandler;
exports.publicAsyncHandler = publicAsyncHandler;
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Handler para rutas autenticadas - con validación de usuario
 */
function authenticatedAsyncHandler(fn) {
    return (req, res, next) => {
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
function publicAsyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
