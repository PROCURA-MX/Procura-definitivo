import { Request, Response } from 'express';
import { z } from 'zod';
import { HistorialService } from '../services/historialService';
import { asyncHandler } from '../utils/asyncHandler';
import { 
  createHistorialCobroSchema,
  updateHistorialCobroSchema,
  historialCobroIdSchema,
  historialFiltrosSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, validateQuery, getValidatedBody, getValidatedParams, getValidatedQuery } from '../middleware/validation';
import { createNotFoundError, createBadRequestError } from '../middleware/errorHandler';

export const getAllHistorialCobros = [
    validateQuery(historialFiltrosSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const filtros = getValidatedQuery(req);
        const organizacionId = (req as any).organizationId;
        
        console.log('🔍 DEBUG - getAllHistorialCobros con filtros:', filtros);
        console.log('🔍 DEBUG - organizacionId:', organizacionId);
        
        const historial = await HistorialService.obtenerHistorialGeneral({
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

export const getHistorialCobroById = [
    validateParams(historialCobroIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        const organizacionId = (req as any).organizationId;
        
        const historial = await HistorialService.obtenerHistorialCobro(id, organizacionId);
        
        if (!historial || historial.length === 0) {
            throw createNotFoundError('Registro de historial no encontrado');
        }
        
        res.json({
            success: true,
            data: historial[0]
        });
    })
];

export const createHistorialCobro = [
    validateBody(createHistorialCobroSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const data = getValidatedBody(req);
        const organizacionId = (req as any).organizationId;
        
        await HistorialService.registrarCambio({
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

export const updateHistorialCobro = [
    validateParams(historialCobroIdSchema),
    validateBody(updateHistorialCobroSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = getValidatedParams(req);
        const data = getValidatedBody(req);
        const organizacionId = (req as any).organizationId;
        
        // Nota: En un sistema de historial, generalmente no se actualizan los registros
        // ya que son inmutables por naturaleza. Si necesitas corregir algo,
        // es mejor crear un nuevo registro de corrección.
        
        throw createBadRequestError('Los registros de historial no pueden ser modificados. Son inmutables por diseño.');
    })
];

export const deleteHistorialCobro = [
    validateParams(historialCobroIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
        // Nota: En un sistema de historial, generalmente no se eliminan los registros
        // ya que son inmutables por naturaleza y necesarios para auditoría.
        // Si necesitas "eliminar" algo, es mejor marcar como eliminado o crear un registro de corrección.
        
        throw createBadRequestError('Los registros de historial no pueden ser eliminados. Son inmutables por diseño y necesarios para auditoría.');
    })
];

// Nuevos endpoints especializados
export const getHistorialCobro = [
    validateParams(z.object({ id: z.string().uuid('ID de cobro inválido') })),
    asyncHandler(async (req: Request, res: Response) => {
        const { id: cobroId } = getValidatedParams(req);
        const organizacionId = (req as any).organizationId;
        
        const historial = await HistorialService.obtenerHistorialCobro(cobroId, organizacionId);
        
        res.json({
            success: true,
            data: historial
        });
    })
];

export const getEstadisticasHistorial = [
    asyncHandler(async (req: Request, res: Response) => {
        const organizacionId = (req as any).organizationId;
        
        const estadisticas = await HistorialService.obtenerEstadisticasHistorial(organizacionId);
        
        res.json({
            success: true,
            data: estadisticas
        });
    })
]; 