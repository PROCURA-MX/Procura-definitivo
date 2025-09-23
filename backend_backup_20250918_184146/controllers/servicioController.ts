import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAllServicios = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener organizacion_id del usuario autenticado si está disponible
    const organizacionId = (req as any).tenantFilter?.organizacion_id;
    
    let servicios;
    if (organizacionId) {
      // ✅ SOLUCIÓN ROBUSTA: Usar Prisma ORM para incluir todas las columnas
      servicios = await prisma.servicio.findMany({
        where: {
          organizacion_id: organizacionId,
        },
        orderBy: { nombre: 'asc' }
      });
    } else {
      // Sin filtro de organización (comportamiento original)
      servicios = await prisma.servicio.findMany({
        orderBy: { nombre: 'asc' }
      });
    }
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

export const getServicioById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }
    res.json(servicio);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
};

export const createServicio = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ DEBUG: Log completo del request body
    console.log('🔍 DEBUG - Request body completo:', JSON.stringify(req.body, null, 2));
    
    const { nombre, precio_base, descripcion, clave_sat, clave_unidad } = req.body;
    
    // ✅ DEBUG: Log de cada campo extraído
    console.log('🔍 DEBUG - Campos extraídos:', {
      nombre,
      precio_base,
      descripcion,
      clave_sat,
      clave_unidad
    });
    
    if (!nombre || !precio_base) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }
    
    // Obtener organizacion_id del usuario autenticado
    const organizacionId = (req as any).tenantFilter?.organizacion_id;
    
    if (!organizacionId) {
      res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
      return;
    }
    
    // ✅ DEBUG: Log de los datos que se van a insertar
    const dataToInsert = {
      nombre,
      descripcion: descripcion || null,
      precio_base: parseFloat(precio_base),
      clave_sat: clave_sat || null,
      clave_unidad: clave_unidad || null,
      organizacion_id: organizacionId,
    };
    console.log('🔍 DEBUG - Datos a insertar:', JSON.stringify(dataToInsert, null, 2));
    
    // ✅ SOLUCIÓN ROBUSTA: Usar Prisma ORM en lugar de SQL directo
    const servicio = await prisma.servicio.create({
      data: dataToInsert,
    });
    
    // ✅ DEBUG: Log del resultado
    console.log('🔍 DEBUG - Servicio creado:', JSON.stringify(servicio, null, 2));
    
    res.status(200).json(servicio);
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(400).json({ error: 'Error al crear servicio' });
  }
};

export const updateServicio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, precio_base, descripcion, clave_sat, clave_unidad } = req.body;
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (precio_base) updateData.precio_base = parseFloat(precio_base);
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (clave_sat !== undefined) updateData.clave_sat = clave_sat;
    if (clave_unidad !== undefined) updateData.clave_unidad = clave_unidad;
    const servicio = await prisma.servicio.update({ where: { id }, data: updateData });
    res.json(servicio);
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
};

export const deleteServicio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.servicio.delete({ where: { id } });
    res.status(200).json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
}; 
    res.status(400).json({ error: 'Error al crear servicio' });
  }
};

export const updateServicio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, precio_base, descripcion, clave_sat, clave_unidad } = req.body;
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (precio_base) updateData.precio_base = parseFloat(precio_base);
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (clave_sat !== undefined) updateData.clave_sat = clave_sat;
    if (clave_unidad !== undefined) updateData.clave_unidad = clave_unidad;
    const servicio = await prisma.servicio.update({ where: { id }, data: updateData });
    res.json(servicio);
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
};

export const deleteServicio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.servicio.delete({ where: { id } });
    res.status(200).json({ message: 'Servicio eliminado' });
  } catch (error) {
    res.status(404).json({ error: 'Servicio no encontrado' });
  }
}; 