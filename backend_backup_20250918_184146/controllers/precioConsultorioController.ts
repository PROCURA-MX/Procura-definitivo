import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAllPreciosConsultorio = async (req: Request, res: Response): Promise<void> => {
    try {
        const precios = await prisma.precioConsultorio.findMany();
        res.json(precios);
    } catch (error) {
        console.error('Error getting all precios consultorio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getPrecioConsultorioById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const precio = await prisma.precioConsultorio.findUnique({ 
            where: { id } 
        });
        
        if (!precio) {
            res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
            return;
        }
        
        res.json(precio);
    } catch (error) {
        console.error('Error getting precio consultorio by id:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const createPrecioConsultorio = async (req: Request, res: Response): Promise<void> => {
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
        const nuevoPrecio = await prisma.precioConsultorio.create({
            data: {
                consultorio_id,
                concepto,
                precio: precioValue,
            },
        });
        res.status(200).json(nuevoPrecio);
    } catch (error) {
        console.error('Error creating precio consultorio:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Error al crear precio consultorio' });
    }
};

export const updatePrecioConsultorio = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { consultorio_id, concepto, precio } = req.body;
        const data: any = {};
        if (consultorio_id !== undefined) data.consultorio_id = consultorio_id;
        if (concepto !== undefined) data.concepto = concepto;
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
        const precioActualizado = await prisma.precioConsultorio.update({
            where: { id },
            data,
        });
        res.status(200).json(precioActualizado);
    } catch (error) {
        console.error('Error updating precio consultorio:', error);
        res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
    }
};

export const deletePrecioConsultorio = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.precioConsultorio.delete({ where: { id } });
        res.status(200).json({ message: 'PrecioConsultorio eliminado' });
    } catch (error) {
        console.error('Error deleting precio consultorio:', error);
        res.status(404).json({ error: 'PrecioConsultorio no encontrado' });
    }
}; 