"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBloqueosMedico = getBloqueosMedico;
exports.createBloqueoMedico = createBloqueoMedico;
exports.updateBloqueoMedico = updateBloqueoMedico;
exports.deleteBloqueoMedico = deleteBloqueoMedico;
const prisma_1 = __importDefault(require("../prisma"));
async function getBloqueosMedico(req, res) {
    try {
        const { usuario_id } = req.query;
        const where = usuario_id ? { usuario_id: String(usuario_id) } : {};
        const bloqueos = await prisma_1.default.bloqueoMedico.findMany({ where });
        res.json(bloqueos);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al obtener bloqueos', details: err });
    }
}
async function createBloqueoMedico(req, res) {
    try {
        const { usuario_id, fecha_inicio, fecha_fin, motivo } = req.body;
        // Obtener el usuario autenticado
        const authenticatedUser = req.user;
        // Validar permisos: Los doctores pueden gestionar calendario por defecto, 
        // las enfermeras/secretarias necesitan el permiso explícito
        if (authenticatedUser.rol !== 'DOCTOR' && !authenticatedUser.puede_gestionar_calendario) {
            console.log(`❌ [createBloqueoMedico] Usuario ${authenticatedUser.email} (${authenticatedUser.rol}) no tiene permisos para gestionar el calendario`);
            return res.status(403).json({
                error: 'No tienes permisos para gestionar el calendario',
                code: 'INSUFFICIENT_PERMISSIONS',
                details: 'Los doctores pueden gestionar el calendario por defecto. Las enfermeras/secretarias necesitan el permiso puede_gestionar_calendario'
            });
        }
        // Validar que el usuario_id en el body coincida con el usuario autenticado
        if (usuario_id !== authenticatedUser.id) {
            console.log(`❌ [createBloqueoMedico] Usuario ${authenticatedUser.email} intentó crear bloqueo para otro usuario: ${usuario_id}`);
            return res.status(403).json({
                error: 'No puedes gestionar bloqueos para otros usuarios',
                code: 'UNAUTHORIZED_USER_ID',
                details: 'El usuario_id debe coincidir con el usuario autenticado'
            });
        }
        console.log(`✅ [createBloqueoMedico] Usuario ${authenticatedUser.email} (${authenticatedUser.rol}) creando bloqueo con permisos válidos`);
        if (!usuario_id || !fecha_inicio || !fecha_fin)
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        if (fecha_inicio >= fecha_fin)
            return res.status(400).json({ error: 'La fecha/hora de inicio debe ser menor que la de fin' });
        const now = roundToMinute(new Date());
        const inicio = roundToMinute(new Date(fecha_inicio));
        console.log('DEBUG bloqueo:', {
            fecha_inicio,
            now: now.toISOString(),
            inicio: inicio.toISOString(),
            diffMs: inicio.getTime() - now.getTime(),
            nowLocal: new Date().toString(),
            inicioLocal: new Date(fecha_inicio).toString()
        });
        if (inicio <= now) {
            return res.status(400).json({ error: 'La fecha de inicio debe ser posterior a la actual' });
        }
        // Parsear fechas a Date para evitar errores de Prisma
        const ini = new Date(fecha_inicio);
        const fin = new Date(fecha_fin);
        // Validar solapamiento
        const overlapping = await prisma_1.default.bloqueoMedico.findFirst({
            where: {
                usuario_id,
                OR: [
                    {
                        fecha_inicio: { lte: fin },
                        fecha_fin: { gte: ini }
                    }
                ]
            }
        });
        if (overlapping)
            return res.status(400).json({ error: 'Ya existe un bloqueo que se solapa con este periodo' });
        const bloqueo = await prisma_1.default.bloqueoMedico.create({
            data: { usuario_id, fecha_inicio: ini, fecha_fin: fin, motivo }
        });
        res.status(201).json(bloqueo);
    }
    catch (err) {
        console.error('Error en createBloqueoMedico:', err);
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: 'Error al crear bloqueo', details: err });
        }
    }
}
async function updateBloqueoMedico(req, res) {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin, motivo } = req.body;
        if (fecha_inicio >= fecha_fin)
            return res.status(400).json({ error: 'La fecha/hora de inicio debe ser menor que la de fin' });
        if (new Date(fecha_inicio) < new Date())
            return res.status(400).json({ error: 'No puedes poner bloqueos en el pasado' });
        // Validar solapamiento (excluyendo el propio)
        const existing = await prisma_1.default.bloqueoMedico.findFirst({
            where: {
                id: { not: id },
                OR: [
                    {
                        fecha_inicio: { lte: fecha_fin },
                        fecha_fin: { gte: fecha_inicio }
                    }
                ]
            }
        });
        if (existing)
            return res.status(400).json({ error: 'Ya existe un bloqueo que se solapa con este periodo' });
        const bloqueo = await prisma_1.default.bloqueoMedico.update({
            where: { id },
            data: { fecha_inicio, fecha_fin, motivo }
        });
        res.json(bloqueo);
    }
    catch (err) {
        res.status(500).json({ error: 'Error al actualizar bloqueo', details: err });
    }
}
async function deleteBloqueoMedico(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.bloqueoMedico.delete({ where: { id } });
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Error al eliminar bloqueo', details: err });
    }
}
function roundToMinute(date) {
    date.setSeconds(0, 0);
    return date;
}
