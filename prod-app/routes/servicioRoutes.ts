import { Router, Request, Response } from 'express';
import prisma from '../prisma'
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Obtener todos los servicios
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Obtener el usuario autenticado
  const authenticatedUser = (req as any).user;
  
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Obtener la organización del usuario autenticado usando SQL directo
  const currentUserResult = await prisma.$queryRaw`
    SELECT organizacion_id FROM usuarios WHERE id = ${authenticatedUser.id}
  `;
  
  if (!currentUserResult || (currentUserResult as any[]).length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const currentUser = (currentUserResult as any[])[0];
  
  // USAR EL ORGANIZATIONID DEL MIDDLEWARE - NO EL TENANTFILTER
  const organizacionId = (req as any).organizationId;
  
  console.log('🔍 Debug - organizacionId:', organizacionId, 'tipo:', typeof organizacionId);
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
  }
  
  // Filtrar servicios por organización usando Prisma ORM en lugar de raw SQL
  const servicios = await prisma.servicio.findMany({
    where: {
      organizacion_id: organizacionId
    },
    include: {
      organizacion: {
        select: {
          nombre: true
        }
      }
    },
    orderBy: {
      nombre: 'asc'
    }
  });
  
  // Transformar para mantener compatibilidad con el frontend
  const serviciosFormateados = servicios.map(servicio => ({
    ...servicio,
    organizacion_nombre: servicio.organizacion?.nombre
  }));
  
  res.json(serviciosFormateados);
}));

// Obtener un servicio por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const servicio = await prisma.servicio.findUnique({
    where: { id }
  });
  if (!servicio) {
    return res.status(404).json({ error: 'Servicio no encontrado' });
  }
  res.json(servicio);
}));

// Crear un nuevo servicio
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // ✅ DEBUG: Log completo del request body
  console.log('🔍 DEBUG - Request body completo:', JSON.stringify(req.body, null, 2));
  
  const { nombre, descripcion, precio_base, clave_sat, clave_unidad } = req.body;
  
  // ✅ DEBUG: Log de cada campo extraído
  console.log('🔍 DEBUG - Campos extraídos:', {
    nombre,
    descripcion,
    precio_base,
    clave_sat,
    clave_unidad
  });
  
  if (!nombre || !precio_base) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }
  
  // USAR EL ORGANIZATIONID DEL MIDDLEWARE - NO EL TENANTFILTER
  const organizacionId = (req as any).organizationId;
  
  console.log('🔍 DEBUG - organizacionId:', organizacionId, 'tipo:', typeof organizacionId);
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
  }
  
  // ✅ DEBUG: Log de los datos que se van a insertar
  const dataToInsert = {
    nombre,
    descripcion: descripcion || null,
    precio_base: parseFloat(precio_base),
    clave_sat: clave_sat || null,
    clave_unidad: clave_unidad || null,
    organizacion_id: organizacionId
  };
  console.log('🔍 DEBUG - Datos a insertar:', JSON.stringify(dataToInsert, null, 2));
  
  // Usar Prisma ORM en lugar de SQL directo para evitar problemas de tipos
  const servicio = await prisma.servicio.create({
    data: dataToInsert
  });
  
  // ✅ DEBUG: Log del resultado
  console.log('🔍 DEBUG - Servicio creado:', JSON.stringify(servicio, null, 2));
  
  res.status(200).json(servicio);
}));

// Actualizar un servicio
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_base, clave_sat, clave_unidad } = req.body;
  if (!nombre || !precio_base) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }
  const servicio = await prisma.servicio.update({
    where: { id },
    data: {
      nombre,
      descripcion: descripcion || null,
      precio_base: parseFloat(precio_base),
      clave_sat: clave_sat || null,
      clave_unidad: clave_unidad || null
    }
  });
  res.json(servicio);
}));

// Eliminar un servicio
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  // Verificar si el servicio está siendo usado en algún cobro
  const conceptosUsandoServicio = await prisma.cobroConcepto.findFirst({
    where: { servicio_id: id }
  });
  if (conceptosUsandoServicio) {
    return res.status(400).json({ 
      error: 'No se puede eliminar el servicio porque está siendo usado en cobros existentes' 
    });
  }
  await prisma.servicio.delete({
    where: { id }
  });
  res.json({ message: 'Servicio eliminado' });
}));

// Obtener los usos de un servicio (conceptos de cobro y cobros relacionados)
router.get('/:id/usos', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const conceptos = await prisma.cobroConcepto.findMany({
    where: { servicio_id: id },
    include: {
      cobro: {
        include: {
          paciente: true,
          usuario: true,
        }
      },
      consultorio: true,
    }
  });
  res.json(conceptos);
}));

export default router; 