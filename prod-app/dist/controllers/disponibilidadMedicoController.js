"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisponibilidadesMedico = getDisponibilidadesMedico;
exports.createDisponibilidadMedico = createDisponibilidadMedico;
exports.updateDisponibilidadMedico = updateDisponibilidadMedico;
exports.deleteDisponibilidadMedico = deleteDisponibilidadMedico;
const prisma_1 = __importDefault(require("../prisma"));
async function getDisponibilidadesMedico(req, res) {
    try {
        const { usuario_id } = req.query;
        console.log(`🔍 [getDisponibilidadesMedico] Petición recibida - usuario_id: ${usuario_id}`);
        const where = usuario_id ? { usuario_id: String(usuario_id) } : {};
        console.log(`🔍 [getDisponibilidadesMedico] Where clause:`, where);
        const disponibilidades = await prisma_1.default.disponibilidadMedico.findMany({ where });
        console.log(`🔍 [getDisponibilidadesMedico] Disponibilidades encontradas:`, disponibilidades.length);
        console.log(`🔍 [getDisponibilidadesMedico] Datos:`, disponibilidades);
        res.json(disponibilidades);
    }
    catch (err) {
        console.error('❌ [getDisponibilidadesMedico] Error:', err);
        res.status(500).json({ error: 'Error al obtener disponibilidades', details: err });
    }
}
async function createDisponibilidadMedico(req, res) {
    try {
        const { usuario_id, dia_semana, hora_inicio, hora_fin } = req.body;
        // Obtener el usuario autenticado
        const authenticatedUser = req.user;
        // ✅ ARREGLADO: Validar que el usuario esté autenticado
        if (!authenticatedUser) {
            console.log('❌ [createDisponibilidadMedico] Usuario no autenticado');
            return res.status(401).json({
                error: 'Usuario no autenticado',
                code: 'UNAUTHENTICATED'
            });
        }
        // Validar permisos: Los doctores pueden gestionar calendario por defecto, 
        // las enfermeras/secretarias necesitan el permiso explícito
        if (authenticatedUser.rol !== 'DOCTOR' && !authenticatedUser.puede_gestionar_calendario) {
            console.log(`❌ [createDisponibilidadMedico] Usuario ${authenticatedUser.email} (${authenticatedUser.rol}) no tiene permisos para gestionar el calendario`);
            return res.status(403).json({
                error: 'No tienes permisos para gestionar el calendario',
                code: 'INSUFFICIENT_PERMISSIONS',
                details: 'Los doctores pueden gestionar el calendario por defecto. Las enfermeras/secretarias necesitan el permiso puede_gestionar_calendario'
            });
        }
        // Validar que el usuario_id en el body coincida con el usuario autenticado
        if (usuario_id !== authenticatedUser.id) {
            console.log(`❌ [createDisponibilidadMedico] Usuario ${authenticatedUser.email} intentó crear disponibilidad para otro usuario: ${usuario_id}`);
            return res.status(403).json({
                error: 'No puedes gestionar disponibilidad para otros usuarios',
                code: 'UNAUTHORIZED_USER_ID',
                details: 'El usuario_id debe coincidir con el usuario autenticado'
            });
        }
        console.log(`✅ [createDisponibilidadMedico] Usuario ${authenticatedUser.email} (${authenticatedUser.rol}) creando disponibilidad con permisos válidos`);
        if (!usuario_id || dia_semana === undefined || !hora_inicio || !hora_fin)
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        if (hora_inicio >= hora_fin)
            return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
        // Validar duplicados solo si hay solapamiento completo de horarios
        const existing = await prisma_1.default.disponibilidadMedico.findFirst({
            where: {
                usuario_id,
                dia_semana,
                // Solo considerar duplicado si hay solapamiento completo de horarios
                AND: [
                    { hora_inicio: { lte: hora_inicio } },
                    { hora_fin: { gte: hora_fin } }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({
                error: 'Ya existe una disponibilidad que cubre completamente este horario para este médico'
            });
        }
        const disponibilidad = await prisma_1.default.disponibilidadMedico.create({
            data: { usuario_id, dia_semana, hora_inicio, hora_fin }
        });
        console.log(`✅ Disponibilidad creada: ${usuario_id} - Día ${dia_semana} - ${hora_inicio} a ${hora_fin}`);
        res.status(201).json(disponibilidad);
    }
    catch (err) {
        console.error('❌ Error al crear disponibilidad:', err);
        res.status(500).json({ error: 'Error al crear disponibilidad', details: err });
    }
}
async function updateDisponibilidadMedico(req, res) {
    try {
        const { id } = req.params;
        const { dia_semana, hora_inicio, hora_fin } = req.body;
        // Primero obtener la disponibilidad actual para obtener el usuario_id
        const disponibilidadActual = await prisma_1.default.disponibilidadMedico.findUnique({
            where: { id }
        });
        if (!disponibilidadActual) {
            return res.status(404).json({ error: 'Disponibilidad no encontrada' });
        }
        if (hora_inicio >= hora_fin)
            return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
        // Validar duplicados solo si hay solapamiento de horarios (más permisivo)
        const existing = await prisma_1.default.disponibilidadMedico.findFirst({
            where: {
                id: { not: id },
                usuario_id: disponibilidadActual.usuario_id,
                dia_semana,
                // Solo considerar duplicado si hay solapamiento completo de horarios
                AND: [
                    { hora_inicio: { lte: hora_inicio } },
                    { hora_fin: { gte: hora_fin } }
                ]
            }
        });
        if (existing) {
            return res.status(400).json({
                error: 'Ya existe una disponibilidad que cubre completamente este horario para este médico'
            });
        }
        const disponibilidad = await prisma_1.default.disponibilidadMedico.update({
            where: { id },
            data: { dia_semana, hora_inicio, hora_fin }
        });
        console.log(`✅ Disponibilidad actualizada: ${disponibilidadActual.usuario_id} - Día ${dia_semana} - ${hora_inicio} a ${hora_fin}`);
        res.json(disponibilidad);
    }
    catch (err) {
        console.error('❌ Error al actualizar disponibilidad:', err);
        res.status(500).json({ error: 'Error al actualizar disponibilidad', details: err });
    }
}
async function deleteDisponibilidadMedico(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.disponibilidadMedico.delete({ where: { id } });
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar disponibilidad', details: err });
    }
}
