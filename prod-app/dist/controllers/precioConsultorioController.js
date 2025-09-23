"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrecioConsultorio = exports.updatePrecioConsultorio = exports.createPrecioConsultorio = exports.getPrecioConsultorioById = exports.getAllPreciosConsultorio = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllPreciosConsultorio = async (req, res) => {
    try {
        const precios = await prisma_1.default.precioConsultorio.findMany();
        res.json(precios);
    }
    catch (error) {
        console.error('Error getting all precios consultorio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getAllPreciosConsultorio = getAllPreciosConsultorio;
const getPrecioConsultorioById = async (req, res) => {
    try {
        const { id } = req.params;
        const precio = await prisma_1.default.precioConsultorio.findUnique({
            where: { id }
        });
        if (!precio) {
            res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
            return;
        }
        res.json(precio);
    }
    catch (error) {
        console.error('Error getting precio consultorio by id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.getPrecioConsultorioById = getPrecioConsultorioById;
const createPrecioConsultorio = async (req, res) => {
    try {
        const { consultorio_id, concepto, precio } = req.body;
        if (!consultorio_id || !concepto || precio === undefined) {
            res.status(400).json({ error: 'Faltan campos requeridos' });
            return;
        }
        const precioValue = parseFloat(precio);
        if (isNaN(precioValue)) {
            res.status(400).json({ error: 'El campo precio debe ser un número válido' });
            return;
        }
        const nuevoPrecio = await prisma_1.default.precioConsultorio.create({
            data: {
                consultorio_id,
                concepto,
                precio: precioValue,
            },
        });
        res.status(200).json(nuevoPrecio);
    }
    catch (error) {
        console.error('Error creating precio consultorio:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Error al crear precio consultorio' });
    }
};
exports.createPrecioConsultorio = createPrecioConsultorio;
const updatePrecioConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultorio_id, concepto, precio } = req.body;
        const data = {};
        if (consultorio_id !== undefined)
            data.consultorio_id = consultorio_id;
        if (concepto !== undefined)
            data.concepto = concepto;
        if (precio !== undefined) {
            const precioValue = parseFloat(precio);
            if (isNaN(precioValue)) {
                res.status(400).json({ error: 'El campo precio debe ser un número válido' });
                return;
            }
            data.precio = precioValue;
        }
        if (Object.keys(data).length === 0) {
            res.status(400).json({ error: 'No se enviaron campos para actualizar' });
            return;
        }
        const precioActualizado = await prisma_1.default.precioConsultorio.update({
            where: { id },
            data,
        });
        res.status(200).json(precioActualizado);
    }
    catch (error) {
        console.error('Error updating precio consultorio:', error);
        res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
    }
};
exports.updatePrecioConsultorio = updatePrecioConsultorio;
const deletePrecioConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.precioConsultorio.delete({ where: { id } });
        res.status(200).json({ message: 'PrecioConsultorio eliminado' });
    }
    catch (error) {
        console.error('Error deleting precio consultorio:', error);
        res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
    }
};
exports.deletePrecioConsultorio = deletePrecioConsultorio;
