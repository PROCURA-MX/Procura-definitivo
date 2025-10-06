import { Request, Response } from 'express';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';

// Tipos para actualización de pacientes
interface PacienteUpdateData {
  nombre?: string;
  fecha_nacimiento?: Date;
  genero?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  documento_identidad?: string;
}

export const getAllPacientes = asyncHandler(async (req: Request, res: Response) => {
  // OPTIMIZACIÓN: Agregar paginación para evitar cargar todos los datos
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 1000; // Aumentar límite por defecto
  const offset = (page - 1) * limit;
  
  // Obtener organizacion_id del usuario autenticado
  const organizacionId = (req as any).tenantFilter?.organizacion_id;
  
  let pacientes;
  let totalCount;
  
  if (organizacionId) {
    // OPTIMIZACIÓN: Query con paginación y solo campos necesarios
    const [pacientesData, countData] = await Promise.all([
      prisma.paciente.findMany({
        where: { organizacion_id: organizacionId },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          fecha_nacimiento: true,
          genero: true,
          telefono: true,
          email: true,
          created_at: true,
          updated_at: true
        },
        orderBy: [
          { nombre: 'asc' },
          { apellido: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.paciente.count({
        where: { organizacion_id: organizacionId }
      })
    ]);
    
    pacientes = pacientesData;
    totalCount = countData;
  } else {
    // Comportamiento original con paginación
    const [pacientesData, countData] = await Promise.all([
      prisma.paciente.findMany({
        select: {
          id: true,
          nombre: true,
          apellido: true,
          fecha_nacimiento: true,
          genero: true,
          telefono: true,
          email: true,
          created_at: true,
          updated_at: true
        },
        orderBy: [
          { nombre: 'asc' },
          { apellido: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.paciente.count()
    ]);
    
    pacientes = pacientesData;
    totalCount = countData;
  }
  
  // Respuesta con información de paginación
  const totalPages = Math.ceil(totalCount / limit);
  
  res.json({
    pacientes,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages
    }
  });
});

export const searchPacientes = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = 1, limit = 20 } = req.query;
  const searchTerm = q as string;
  
  if (!searchTerm || searchTerm.trim().length < 2) {
    return res.json({ pacientes: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  }
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;
  
  const organizacionId = (req as any).tenantFilter?.organizacion_id;
  
  // Usar SQL directo para búsqueda más flexible que incluya combinaciones de nombre + apellido
  const searchPattern = `%${searchTerm}%`;
  
  // Usar SQL directo para búsqueda más flexible
  const pacientes = await prisma.$queryRaw`
    SELECT id, nombre, apellido, fecha_nacimiento, genero, telefono, email, created_at, updated_at
    FROM pacientes 
    WHERE organizacion_id = ${organizacionId}::uuid
    AND (
      LOWER(nombre) LIKE LOWER(${searchPattern})
      OR LOWER(apellido) LIKE LOWER(${searchPattern})
      OR LOWER(CONCAT(nombre, ' ', apellido)) LIKE LOWER(${searchPattern})
      OR LOWER(email) LIKE LOWER(${searchPattern})
      OR telefono LIKE ${searchPattern}
      OR documento_identidad LIKE ${searchPattern}
    )
    ORDER BY nombre ASC, apellido ASC
    LIMIT ${limitNum} OFFSET ${offset}
  ` as any[];

  const totalCountResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM pacientes 
    WHERE organizacion_id = ${organizacionId}::uuid
    AND (
      LOWER(nombre) LIKE LOWER(${searchPattern})
      OR LOWER(apellido) LIKE LOWER(${searchPattern})
      OR LOWER(CONCAT(nombre, ' ', apellido)) LIKE LOWER(${searchPattern})
      OR LOWER(email) LIKE LOWER(${searchPattern})
      OR telefono LIKE ${searchPattern}
      OR documento_identidad LIKE ${searchPattern}
    )
  ` as any[];

  const totalCount = parseInt(totalCountResult[0].count);
  
  const totalPages = Math.ceil(totalCount / limitNum);
  
  res.json({
    pacientes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages
    }
  });
});

export const getPacienteById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  // Traer historial de citas
  const citas = await prisma.citas.findMany({
    where: { paciente_id: id },
    orderBy: { fecha_inicio: 'desc' },
    include: {
      usuarios: { select: { id: true, nombre: true, apellido: true } },
      consultorios: { select: { id: true, nombre: true } },
    },
  });
  res.json({ ...paciente, citas });
});

export const createPaciente = asyncHandler(async (req: Request, res: Response) => {
  console.log('Body recibido en createPaciente:', req.body);
  console.log('🔍 Debug - req.tenantFilter:', (req as any).tenantFilter);
  console.log('🔍 Debug - req.organizationId:', (req as any).organizationId);
  console.log('🔍 Debug - req.user:', (req as any).user);
  
  const { nombre, apellido, fecha_nacimiento, genero, telefono, email } = req.body;
  // Validar campos requeridos
  if (!nombre || !apellido || !fecha_nacimiento || !genero || !telefono || !email) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Obtener organizacion_id del usuario autenticado PRIMERO
  const organizacionId = (req as any).tenantFilter?.organizacion_id || (req as any).organizationId || (req as any).user?.organizacion_id;
  
  console.log('🔍 Debug - organizacionId obtenido:', organizacionId);
  
  if (!organizacionId) {
    console.log('❌ Error - No se pudo determinar la organización del usuario');
    console.log('❌ Debug - req completo:', JSON.stringify(req, null, 2));
    return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
  }

  // ✅ ARREGLADO: Verificar duplicados por email o teléfono SOLO DENTRO DE LA MISMA ORGANIZACIÓN
  const existing = await prisma.paciente.findFirst({
    where: {
      organizacion_id: organizacionId, // ✅ CRÍTICO: Solo buscar en la misma organización
      OR: [
        { email: email },
        { telefono: telefono }
      ]
    }
  });
  if (existing) {
    return res.status(400).json({ 
      error: 'Ya existe un paciente con ese email o teléfono en esta organización.',
      code: 'DUPLICATE_PATIENT_IN_ORGANIZATION',
      details: 'El email y teléfono deben ser únicos dentro de cada organización'
    });
  }
  
  // Usar SQL directo para evitar problemas de tipos
  const result = await prisma.$queryRaw`
    INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, genero, telefono, email, organizacion_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${nombre}, ${apellido}, ${new Date(fecha_nacimiento)}, ${genero}, ${telefono}, ${email}, ${organizacionId}::uuid, NOW(), NOW())
    RETURNING *
  `;
  const paciente = (result as any[])[0];
  res.json(paciente);
});

export const updatePaciente = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, fecha_nacimiento, genero, direccion, telefono, email, documento_identidad } = req.body;
  
  // Obtener organizacion_id del usuario autenticado
  const organizacionId = (req as any).tenantFilter?.organizacion_id || (req as any).organizationId || (req as any).user?.organizacion_id;
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
  }

  // ✅ ARREGLADO: Verificar duplicados por email o teléfono SOLO DENTRO DE LA MISMA ORGANIZACIÓN
  // Solo validar si se están actualizando email o teléfono
  if (email || telefono) {
    const existing = await prisma.paciente.findFirst({
      where: {
        organizacion_id: organizacionId, // ✅ CRÍTICO: Solo buscar en la misma organización
        id: { not: id }, // ✅ CRÍTICO: Excluir el paciente actual
        OR: [
          ...(email ? [{ email: email }] : []),
          ...(telefono ? [{ telefono: telefono }] : [])
        ]
      }
    });
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Ya existe un paciente con ese email o teléfono en esta organización.',
        code: 'DUPLICATE_PATIENT_IN_ORGANIZATION',
        details: 'El email y teléfono deben ser únicos dentro de cada organización'
      });
    }
  }
  
  const updateData: PacienteUpdateData = {};
  if (nombre) updateData.nombre = nombre;
  if (fecha_nacimiento) updateData.fecha_nacimiento = new Date(fecha_nacimiento);
  if (genero) updateData.genero = genero;
  if (direccion) updateData.direccion = direccion;
  if (telefono) updateData.telefono = telefono;
  if (email) updateData.email = email;
  if (documento_identidad) updateData.documento_identidad = documento_identidad;

  const paciente = await prisma.paciente.update({
    where: { id },
    data: updateData,
  });
  res.json(paciente);
});

export const deletePaciente = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.paciente.delete({ where: { id } });
  res.json({ message: 'Paciente eliminado' });
}); 
