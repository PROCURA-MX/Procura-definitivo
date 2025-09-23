import { Request, Response } from 'express';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';

export const getAllConsultorios = asyncHandler(async (req: Request, res: Response) => {
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
  
  // Filtrar consultorios por organización
  const consultorios = await prisma.$queryRaw`
    SELECT c.id, c.nombre, c.direccion, c.created_at, c.updated_at, o.nombre as organizacion_nombre
    FROM consultorios c
    JOIN organizaciones o ON c.organizacion_id = o.id
    WHERE c.organizacion_id = ${currentUser.organizacion_id}::uuid
    ORDER BY c.nombre
    LIMIT 20
  `;
  
  res.json(consultorios);
});

// Nuevo endpoint para obtener consultorios del usuario actual según su rol
export const getConsultoriosUsuario = asyncHandler(async (req: Request, res: Response) => {
  // Obtener el usuario autenticado
  const authenticatedUser = (req as any).user;
  
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Obtener información completa del usuario
  const user = await prisma.usuario.findUnique({
    where: { id: authenticatedUser.id },
    include: {
      consultorio: true,
      organizacion: true
    }
  });
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  let consultorios;
  
  if (user.rol === 'DOCTOR') {
    // Los doctores pueden ver solo consultorios que tienen usuarios asociados
    try {
      console.log('🔍 consultorioController - Ejecutando consulta para DOCTOR...');
      consultorios = await prisma.$queryRaw`
        SELECT DISTINCT c.id, c.nombre, c.direccion, c.created_at, c.updated_at
        FROM consultorios c
        INNER JOIN usuarios u ON c.id = u.consultorio_id
        WHERE c.organizacion_id = ${user.organizacion_id}::uuid
        ORDER BY c.nombre ASC
      ` as any[];
      console.log('🔍 consultorioController - Consulta completada, consultorios encontrados:', consultorios.length);
    } catch (error) {
      console.error('❌ Error en consulta SQL:', error);
      // Fallback: usar consulta simple
      consultorios = await prisma.consultorio.findMany({
        where: { organizacion_id: user.organizacion_id },
        select: { id: true, nombre: true, direccion: true, created_at: true, updated_at: true },
        orderBy: { nombre: 'asc' }
      });
    }
  } else {
    // Otros roles solo pueden ver su consultorio asignado
    consultorios = await prisma.consultorio.findMany({
      where: {
        id: user.consultorio_id
      },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        created_at: true,
        updated_at: true
      }
    });
  }
  
  const response = {
    consultorios,
    userRole: user.rol,
    currentConsultorio: user.consultorio,
    canSelectMultiple: user.rol === 'DOCTOR' && consultorios.length > 0
  };
  
  console.log('🔍 consultorioController - Respuesta del endpoint /usuario:', response);
  res.json(response);
});

export const getConsultorioById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const consultorio = await prisma.consultorio.findUnique({ where: { id } });
  if (!consultorio) return res.status(404).json({ error: 'Consultorio no encontrado' });
  res.json(consultorio);
});

// Endpoint para obtener el doctor del consultorio - SOLUCIÓN ROBUSTA ESTILO AMAZON
export const getDoctorDelConsultorio = asyncHandler(async (req: Request, res: Response) => {
  const { consultorioId } = req.params;
  const authenticatedUser = (req as any).user;
  
  console.log('🔍 [getDoctorDelConsultorio] Iniciando búsqueda de doctor para consultorio:', consultorioId);
  console.log('🔍 [getDoctorDelConsultorio] Usuario autenticado:', authenticatedUser?.id);
  
  // Validación robusta de parámetros
  if (!consultorioId || consultorioId.trim() === '') {
    console.error('❌ [getDoctorDelConsultorio] ID del consultorio no válido:', consultorioId);
    return res.status(400).json({ 
      error: 'ID del consultorio es requerido',
      code: 'INVALID_CONSULTORIO_ID',
      details: 'El ID del consultorio no puede estar vacío'
    });
  }

  // Validar formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(consultorioId)) {
    console.error('❌ [getDoctorDelConsultorio] Formato de UUID inválido:', consultorioId);
    return res.status(400).json({ 
      error: 'Formato de ID de consultorio inválido',
      code: 'INVALID_UUID_FORMAT',
      details: 'El ID debe ser un UUID válido'
    });
  }

  if (!authenticatedUser) {
    console.error('❌ [getDoctorDelConsultorio] Usuario no autenticado');
    return res.status(401).json({ 
      error: 'Usuario no autenticado',
      code: 'UNAUTHORIZED',
      details: 'Se requiere autenticación para acceder a este recurso'
    });
  }

  try {
    // Usar el servicio centralizado de disponibilidad
    const { AvailabilityService } = await import('../services/availabilityService');
    
    const context = {
      userId: authenticatedUser.id,
      userRole: authenticatedUser.rol,
      consultorioId: consultorioId,
      organizacionId: authenticatedUser.organizacion_id
    };
    
    console.log('🔍 [getDoctorDelConsultorio] Usando AvailabilityService con contexto:', context);
    
    const result = await AvailabilityService.getDoctorForAvailability(context);
    
    if (result.success && result.doctorId) {
      console.log('✅ [getDoctorDelConsultorio] Doctor obtenido exitosamente:', result.doctorId);
      
      res.json({
        success: true,
        data: result.doctor || { id: result.doctorId },
        message: result.fallbackUsed ? 'Doctor obtenido usando fallback' : 'Doctor encontrado exitosamente',
        metadata: result.metadata,
        fallbackUsed: result.fallbackUsed || false
      });
    } else {
      console.error('❌ [getDoctorDelConsultorio] No se pudo obtener doctor:', result.error);
      
      res.status(404).json({ 
        error: result.error || 'No se pudo determinar el doctor para este consultorio',
        code: 'DOCTOR_NOT_FOUND',
        details: 'El sistema no pudo encontrar un doctor apropiado para mostrar disponibilidad',
        metadata: result.metadata
      });
    }
    
  } catch (error) {
    console.error('❌ [getDoctorDelConsultorio] Error interno:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'INTERNAL_SERVER_ERROR',
      details: 'Error al buscar doctor del consultorio'
    });
  }
});

// Health check endpoint para monitorear el sistema
export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { AvailabilityService } = await import('../services/availabilityService');
    const healthStatus = await AvailabilityService.healthCheck();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ConsultorioController',
      availability: healthStatus
    });
  } catch (error) {
    console.error('❌ [healthCheck] Error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'ConsultorioController',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const createConsultorio = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, direccion } = req.body;
  
  // Validar campos requeridos
  if (!nombre || !direccion) {
    return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
  }
  
  // Obtener organizacion_id del usuario autenticado
  const authenticatedUser = (req as any).user;
  
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Obtener la organización del usuario autenticado
  const currentUserResult = await prisma.$queryRaw`
    SELECT organizacion_id FROM usuarios WHERE id = ${authenticatedUser.id}
  `;
  
  if (!currentUserResult || (currentUserResult as any[]).length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const currentUser = (currentUserResult as any[])[0];
  const organizacionId = currentUser.organizacion_id;
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'Usuario sin organización asignada' });
  }
  
  try {
    // Usar Prisma ORM para inserción robusta y manejo automático de campos
    const consultorio = await prisma.consultorio.create({
      data: {
        nombre,
        direccion,
        organizacion_id: organizacionId,
      },
      include: {
        organizacion: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
    
    res.json(consultorio);
  } catch (error: any) {
    console.error('Error creando consultorio:', error);
    
    // Manejo específico de errores de base de datos
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un consultorio con ese nombre en esta organización' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Organización no válida' });
    }
    
    return res.status(500).json({ error: 'Error interno del servidor al crear consultorio' });
  }
});

export const updateConsultorio = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, direccion } = req.body;
  const consultorio = await prisma.consultorio.update({
    where: { id },
    data: { nombre, direccion },
  });
  res.json(consultorio);
});

export const deleteConsultorio = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;
  
  // Obtener el usuario autenticado
  const authenticatedUser = (req as any).user;
  
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Verificar que el usuario sea DOCTOR
  if (authenticatedUser.rol !== 'DOCTOR') {
    return res.status(403).json({ error: 'Solo los doctores pueden eliminar consultorios' });
  }
  
  // Validar contraseña
  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida para eliminar consultorio' });
  }
  
  // Verificar autenticación adicional usando email
  const user = await prisma.usuario.findUnique({
    where: { id: authenticatedUser.id },
    select: { email: true }
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  
  // Para mayor seguridad, verificar que el email coincida con el token
  if (user.email !== authenticatedUser.email) {
    return res.status(401).json({ error: 'Autenticación inválida' });
  }
  
  // Verificar que el consultorio existe y pertenece a la organización del usuario
  const consultorio = await prisma.consultorio.findFirst({
    where: { 
      id,
      organizacion_id: authenticatedUser.organizacion_id
    }
  });
  
  if (!consultorio) {
    return res.status(404).json({ error: 'Consultorio no encontrado o no tienes permisos para eliminarlo' });
  }
  
  // Verificar dependencias antes de eliminar - SOLUCIÓN ROBUSTA Y SIMPLE
  const dependencias = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM usuarios WHERE consultorio_id = ${id}) as usuarios_count
  ` as any[];
  
  const deps = dependencias[0];
  const totalDependencias = deps.usuarios_count;
  
  if (totalDependencias > 0) {
    return res.status(400).json({ 
      error: 'No se puede eliminar el consultorio porque tiene usuarios asociados',
      dependencias: {
        usuarios: deps.usuarios_count,
        total: totalDependencias
      }
    });
  }
  
  try {
    // Eliminar el consultorio
    await prisma.consultorio.delete({ where: { id } });
    
    console.log(`🗑️ Consultorio eliminado: ${consultorio.nombre} (ID: ${id}) por usuario: ${authenticatedUser.email}`);
    
    res.json({ 
      message: 'Consultorio eliminado exitosamente',
      consultorioEliminado: {
        id,
        nombre: consultorio.nombre
      }
    });
  } catch (error: any) {
    console.error('Error eliminando consultorio:', error);
    return res.status(500).json({ error: 'Error interno del servidor al eliminar consultorio' });
  }
}); 