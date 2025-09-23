import { Request, Response } from 'express';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';

export const getAllOrganizaciones = asyncHandler(async (req: Request, res: Response) => {
  const organizaciones = await prisma.organizacion.findMany({
    include: {
      _count: {
        select: {
          usuarios: true,
          consultorios: true,
          pacientes: true,
          servicios: true
        }
      }
    }
  });
  res.json(organizaciones);
});

export const getOrganizacionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const organizacion = await prisma.organizacion.findUnique({
    where: { id },
    include: {
      usuarios: {
        include: { consultorio: true }
      },
      consultorios: true,
      servicios: true,
      pacientes: {
        take: 10,
        orderBy: { created_at: 'desc' }
      },
      _count: {
        select: {
          usuarios: true,
          consultorios: true,
          pacientes: true,
          servicios: true
        }
      }
    }
  });
  
  if (!organizacion) {
    return res.status(404).json({ error: 'Organización no encontrada' });
  }
  
  res.json(organizacion);
});

export const createOrganizacion = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre de organización es requerido' });
  }
  
  const organizacion = await prisma.organizacion.create({
    data: {
      nombre,
      ruc,
      direccion,
      telefono,
      email,
      logo_url,
      color_primario: color_primario || '#3B82F6',
      color_secundario: color_secundario || '#1F2937'
    }
  });
  
  res.json(organizacion);
});

export const updateOrganizacion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = req.body;
  
  const updateData: any = {};
  if (nombre) updateData.nombre = nombre;
  if (ruc !== undefined) updateData.ruc = ruc;
  if (direccion !== undefined) updateData.direccion = direccion;
  if (telefono !== undefined) updateData.telefono = telefono;
  if (email !== undefined) updateData.email = email;
  if (logo_url !== undefined) updateData.logo_url = logo_url;
  if (color_primario) updateData.color_primario = color_primario;
  if (color_secundario) updateData.color_secundario = color_secundario;
  
  const organizacion = await prisma.organizacion.update({
    where: { id },
    data: updateData
  });
  
  res.json(organizacion);
});

export const deleteOrganizacion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Verificar que no tenga datos asociados
  const counts = await prisma.$transaction([
    prisma.usuario.count({ where: { organizacion_id: id } }),
    prisma.consultorio.count({ where: { organizacion_id: id } }),
    prisma.paciente.count({ where: { organizacion_id: id } }),
    prisma.servicio.count({ where: { organizacion_id: id } })
  ]);
  
  const [usuarios, consultorios, pacientes, servicios] = counts;
  
  if (usuarios > 0 || consultorios > 0 || pacientes > 0 || servicios > 0) {
    return res.status(400).json({ 
      error: 'No se puede eliminar la organización porque tiene datos asociados',
      details: {
        usuarios,
        consultorios,
        pacientes,
        servicios
      }
    });
  }
  
  await prisma.organizacion.delete({ where: { id } });
  res.json({ message: 'Organización eliminada' });
});

export const getOrganizacionStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const stats = await prisma.$transaction([
    prisma.usuario.count({ where: { organizacion_id: id } }),
    prisma.consultorio.count({ where: { organizacion_id: id } }),
    prisma.paciente.count({ where: { organizacion_id: id } }),
    prisma.servicio.count({ where: { organizacion_id: id } }),
    prisma.cobro.count({ 
      where: { 
        usuario: { organizacion_id: id } 
      } 
    }),
    prisma.citas.count({ 
      where: { 
        usuarios: { organizacion_id: id } 
      } 
    })
  ]);
  
  const [usuarios, consultorios, pacientes, servicios, cobros, citas] = stats;
  
  res.json({
    usuarios,
    consultorios,
    pacientes,
    servicios,
    cobros,
    citas
  });
}); 