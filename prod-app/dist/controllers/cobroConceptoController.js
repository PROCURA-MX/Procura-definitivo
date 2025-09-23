"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCobroConcepto = exports.updateCobroConcepto = exports.createCobroConcepto = exports.getCobroConceptoById = exports.getAllCobroConceptos = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const cacheService_1 = require("../services/cacheService");
// Usar la instancia global del servicio de caché
const getAllCobroConceptos = async (req, res) => {
    try {
        const conceptos = await prisma_1.default.cobroConcepto.findMany({
            include: {
                cobro: true,
                consultorio: true,
            },
        });
        res.json(conceptos);
    }
    catch (error) {
        console.error('Error getting all cobro conceptos:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno del servidor' });
    }
};
exports.getAllCobroConceptos = getAllCobroConceptos;
const getCobroConceptoById = async (req, res) => {
    try {
        const { id } = req.params;
        const concepto = await prisma_1.default.cobroConcepto.findUnique({
            where: { id },
            include: {
                cobro: true,
                consultorio: true,
            },
        });
        if (!concepto) {
            res.status(404).json({ error: 'CobroConcepto no encontrado' });
            return;
        }
        res.json(concepto);
    }
    catch (error) {
        console.error('Error getting cobro concepto by id:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Error interno del servidor' });
    }
};
exports.getCobroConceptoById = getCobroConceptoById;
const createCobroConcepto = async (req, res) => {
    try {
        console.log("🔍 Debug - createCobroConcepto iniciado");
        console.log("🔍 Debug - req.body:", req.body);
        console.log("🔍 Debug - req.headers:", req.headers);
        console.log("🔍 Debug - tenantFilter:", req.tenantFilter);
        const { cobro_id, servicio_id, precio_unitario, cantidad, subtotal, consultorio_id } = req.body;
        if (!cobro_id || !servicio_id || !precio_unitario || !cantidad || !subtotal || !consultorio_id) {
            res.status(400).json({ error: 'Faltan campos requeridos' });
            return;
        }
        const cobro = await prisma_1.default.cobro.findUnique({ where: { id: cobro_id } });
        if (!cobro) {
            res.status(400).json({ error: 'El cobro especificado no existe' });
            return;
        }
        const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
        if (!consultorio) {
            res.status(400).json({ error: 'El consultorio especificado no existe' });
            return;
        }
        const servicio = await prisma_1.default.servicio.findUnique({ where: { id: servicio_id } });
        if (!servicio) {
            res.status(400).json({ error: 'El servicio especificado no existe' });
            return;
        }
        const concepto = await prisma_1.default.cobroConcepto.create({
            data: {
                cobro_id,
                servicio_id,
                precio_unitario: parseFloat(precio_unitario),
                cantidad: parseInt(cantidad),
                subtotal: parseFloat(subtotal),
                consultorio_id,
            },
        });
        // Invalidar caché de cobros para esta organización
        const organizacionId = req.tenantFilter?.organizacion_id;
        console.log("🔍 Debug - tenantFilter:", req.tenantFilter);
        console.log("🔍 Debug - organizacionId:", organizacionId);
        if (organizacionId) {
            cacheService_1.cacheService.invalidateCobros(organizacionId);
            console.log("🔄 Caché de cobros invalidado después de agregar concepto para organización:", organizacionId);
        }
        else {
            console.log("⚠️ No se pudo obtener organizacionId para invalidar caché en concepto");
        }
        res.status(200).json(concepto);
    }
    catch (error) {
        console.error('Error creating cobro concepto:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Error al crear cobro concepto' });
    }
};
exports.createCobroConcepto = createCobroConcepto;
const updateCobroConcepto = async (req, res) => {
    try {
        const { id } = req.params;
        const { cobro_id, servicio_id, precio_unitario, cantidad, subtotal, consultorio_id } = req.body;
        const updateData = {};
        if (cobro_id) {
            const cobro = await prisma_1.default.cobro.findUnique({ where: { id: cobro_id } });
            if (!cobro) {
                res.status(400).json({ error: 'El cobro especificado no existe' });
                return;
            }
            updateData.cobro_id = cobro_id;
        }
        if (servicio_id) {
            const servicio = await prisma_1.default.servicio.findUnique({ where: { id: servicio_id } });
            if (!servicio) {
                res.status(400).json({ error: 'El servicio especificado no existe' });
                return;
            }
            updateData.servicio_id = servicio_id;
        }
        if (precio_unitario) {
            updateData.precio_unitario = parseFloat(precio_unitario);
        }
        if (cantidad) {
            updateData.cantidad = parseInt(cantidad);
        }
        if (subtotal) {
            updateData.subtotal = parseFloat(subtotal);
        }
        if (consultorio_id) {
            const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
            if (!consultorio) {
                res.status(400).json({ error: 'El consultorio especificado no existe' });
                return;
            }
            updateData.consultorio_id = consultorio_id;
        }
        const concepto = await prisma_1.default.cobroConcepto.update({
            where: { id },
            data: updateData,
        });
        // Invalidar caché de cobros para esta organización
        const organizacionId = req.tenantFilter?.organizacion_id;
        if (organizacionId) {
            cacheService_1.cacheService.invalidateCobros(organizacionId);
            console.log("🔄 Caché de cobros invalidado después de actualizar concepto para organización:", organizacionId);
        }
        res.json(concepto);
    }
    catch (error) {
        console.error('Error updating cobro concepto:', error);
        res.status(404).json({ error: 'CobroConcepto no encontrado' });
    }
};
exports.updateCobroConcepto = updateCobroConcepto;
const deleteCobroConcepto = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.cobroConcepto.delete({ where: { id } });
        // Invalidar caché de cobros para esta organización
        const organizacionId = req.tenantFilter?.organizacion_id;
        if (organizacionId) {
            cacheService_1.cacheService.invalidateCobros(organizacionId);
            console.log("🔄 Caché de cobros invalidado después de eliminar concepto para organización:", organizacionId);
        }
        res.json({ message: 'CobroConcepto eliminado' });
    }
    catch (error) {
        console.error('Error deleting cobro concepto:', error);
        res.status(404).json({ error: 'CobroConcepto no encontrado' });
    }
};
exports.deleteCobroConcepto = deleteCobroConcepto;
