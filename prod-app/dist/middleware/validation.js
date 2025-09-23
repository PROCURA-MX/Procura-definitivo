"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidatedParams = exports.getValidatedQuery = exports.getValidatedBody = exports.getValidatedData = exports.validateId = exports.validatePagination = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateRequest = void 0;
const zod_1 = require("zod");
/**
 * Middleware de validación usando Zod
 * Valida automáticamente el body, query y params según el schema proporcionado
 */
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const validatedData = {};
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
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // Formatear errores de validación de manera consistente
                const formattedErrors = error.errors.map((err) => ({
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
exports.validateRequest = validateRequest;
/**
 * Middleware de validación simplificado para solo body
 */
const validateBody = (schema) => {
    return (0, exports.validateRequest)({ body: schema });
};
exports.validateBody = validateBody;
/**
 * Middleware de validación simplificado para solo query params
 */
const validateQuery = (schema) => {
    return (0, exports.validateRequest)({ query: schema });
};
exports.validateQuery = validateQuery;
/**
 * Middleware de validación simplificado para solo route params
 */
const validateParams = (schema) => {
    return (0, exports.validateRequest)({ params: schema });
};
exports.validateParams = validateParams;
/**
 * Middleware para validar paginación estándar
 */
exports.validatePagination = exports.validateQuery;
/**
 * Middleware para validar IDs de UUID
 */
const validateId = (paramName = 'id') => {
    return (0, exports.validateParams)(zod_1.z.object({
        [paramName]: zod_1.z.string().uuid(`El ${paramName} debe ser un UUID válido`)
    }));
};
exports.validateId = validateId;
/**
 * Función helper para obtener datos validados
 */
const getValidatedData = (req, key = 'body') => {
    return req.validatedData?.[key];
};
exports.getValidatedData = getValidatedData;
/**
 * Función helper para obtener body validado
 */
const getValidatedBody = (req) => {
    return (0, exports.getValidatedData)(req, 'body');
};
exports.getValidatedBody = getValidatedBody;
/**
 * Función helper para obtener query validado
 */
const getValidatedQuery = (req) => {
    return (0, exports.getValidatedData)(req, 'query');
};
exports.getValidatedQuery = getValidatedQuery;
/**
 * Función helper para obtener params validado
 */
const getValidatedParams = (req) => {
    return (0, exports.getValidatedData)(req, 'params');
};
exports.getValidatedParams = getValidatedParams;
