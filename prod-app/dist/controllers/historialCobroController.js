"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEstadisticasHistorial = exports.getHistorialCobro = exports.deleteHistorialCobro = exports.updateHistorialCobro = exports.createHistorialCobro = exports.getHistorialCobroById = exports.getAllHistorialCobros = void 0;
const zod_1 = require("zod");
const historialService_1 = require("../services/historialService");
const asyncHandler_1 = require("../utils/asyncHandler");
const validationSchemas_1 = require("../schemas/validationSchemas");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
exports.getAllHistorialCobros = [
    (0, validation_1.validateQuery)(validationSchemas_1.historialFiltrosSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const filtros = (0, validation_1.getValidatedQuery)(req);
        const organizacionId = req.organizationId;
        console.log('🔍 DEBUG - getAllHistorialCobros con filtros:', filtros);
        console.log('🔍 DEBUG - organizacionId:', organizacionId);
        const historial = await historialService_1.HistorialService.obtenerHistorialGeneral({
            ...filtros,
            organizacionId
        });
        res.json({
            success: true,
            data: historial,
            pagination: {
                page: Math.floor((filtros.offset || 0) / (filtros.limit || 50)) + 1,
                limit: filtros.limit || 50,
                total: historial.length,
                pages: Math.ceil(historial.length / (filtros.limit || 50))
            }
        });
    })
];
exports.getHistorialCobroById = [
    (0, validation_1.validateParams)(validationSchemas_1.historialCobroIdSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = (0, validation_1.getValidatedParams)(req);
        const organizacionId = req.organizationId;
        const historial = await historialService_1.HistorialService.obtenerHistorialCobro(id, organizacionId);
        if (!historial || historial.length === 0) {
            throw (0, errorHandler_1.createNotFoundError)('Registro de historial no encontrado');
        }
        res.json({
            success: true,
            data: historial[0]
        });
    })
];
exports.createHistorialCobro = [
    (0, validation_1.validateBody)(validationSchemas_1.createHistorialCobroSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const data = (0, validation_1.getValidatedBody)(req);
        const organizacionId = req.organizationId;
        await historialService_1.HistorialService.registrarCambio({
            entidad: 'cobro',
            entidad_id: data.cobro_id,
            usuario_id: data.usuario_id,
            tipo_cambio: data.tipo_cambio,
            detalles_antes: data.detalles_antes,
            detalles_despues: data.detalles_despues,
            descripcion: data.descripcion,
            organizacion_id: organizacionId
        });
        res.status(201).json({
            success: true,
            message: 'Historial registrado exitosamente'
        });
    })
];
exports.updateHistorialCobro = [
    (0, validation_1.validateParams)(validationSchemas_1.historialCobroIdSchema),
    (0, validation_1.validateBody)(validationSchemas_1.updateHistorialCobroSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id } = (0, validation_1.getValidatedParams)(req);
        const data = (0, validation_1.getValidatedBody)(req);
        const organizacionId = req.organizationId;
        // Nota: En un sistema de historial, generalmente no se actualizan los registros
        // ya que son inmutables por naturaleza. Si necesitas corregir algo,
        // es mejor crear un nuevo registro de corrección.
        throw (0, errorHandler_1.createBadRequestError)('Los registros de historial no pueden ser modificados. Son inmutables por diseño.');
    })
];
exports.deleteHistorialCobro = [
    (0, validation_1.validateParams)(validationSchemas_1.historialCobroIdSchema),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        // Nota: En un sistema de historial, generalmente no se eliminan los registros
        // ya que son inmutables por naturaleza y necesarios para auditoría.
        // Si necesitas "eliminar" algo, es mejor marcar como eliminado o crear un registro de corrección.
        throw (0, errorHandler_1.createBadRequestError)('Los registros de historial no pueden ser eliminados. Son inmutables por diseño y necesarios para auditoría.');
    })
];
// Nuevos endpoints especializados
exports.getHistorialCobro = [
    (0, validation_1.validateParams)(zod_1.z.object({ id: zod_1.z.string().uuid('ID de cobro inválido') })),
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { id: cobroId } = (0, validation_1.getValidatedParams)(req);
        const organizacionId = req.organizationId;
        const historial = await historialService_1.HistorialService.obtenerHistorialCobro(cobroId, organizacionId);
        res.json({
            success: true,
            data: historial
        });
    })
];
exports.getEstadisticasHistorial = [
    (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const organizacionId = req.organizationId;
        const estadisticas = await historialService_1.HistorialService.obtenerEstadisticasHistorial(organizacionId);
        res.json({
            success: true,
            data: estadisticas
        });
    })
];
