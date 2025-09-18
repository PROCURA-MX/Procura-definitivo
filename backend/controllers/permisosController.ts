import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';
import prisma from '../prisma';
import { 
  createUsuarioSchema,
  updateUsuarioSchema,
  usuarioIdSchema,
  updatePermisosSchema
} from '../schemas/validationSchemas';
import { validateBody, validateParams, getValidatedBody, getValidatedParams } from '../middleware/validation';
import { createNotFoundError } from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: any;
  organizacion?: any;
  tenantFilter?: any;
  headers: any;
  url: string;
}

interface RequestWithTenant extends Request {
  tenantFilter?: {
    consultorio_id: string;
    organizacion_id: string;
  };
  user?: any;
  body: any;
}

// Obtener permisos del usuario actual
export const obtenerMisPermisos = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  console.log('🔍 Debug - obtenerMisPermisos llamado');
  console.log('🔍 Debug - Usuario del request:', req.user);
  console.log('🔍 Debug - Request headers:', req.headers.authorization);
  console.log('🔍 Debug - Request URL:', req.url);
  
  // Si tenemos usuario del middleware, consultar permisos actualizados de la BD
  if (req.user) {
    // ✅ CONSULTAR PERMISOS ACTUALIZADOS DE LA BASE DE DATOS
    console.log('🔍 Debug - Consultando usuario en BD con ID:', req.user.id);
    const usuarioBD = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        puede_gestionar_calendario: true,
        puede_gestionar_inventario: true,
        puede_ver_facturas: true,
        puede_crear_facturas: true,
        rol: true
      }
    });

    console.log('🔍 Debug - Usuario de BD:', usuarioBD);
    console.log('🔍 Debug - Usuario ID consultado:', req.user.id);
    console.log('🔍 Debug - ¿Usuario encontrado en BD?', !!usuarioBD);
    if (usuarioBD) {
      console.log('🔍 Debug - Permisos específicos de BD:', {
        puede_gestionar_usuarios: usuarioBD.puede_gestionar_usuarios,
        puede_gestionar_calendario: usuarioBD.puede_gestionar_calendario,
        puede_gestionar_inventario: usuarioBD.puede_gestionar_inventario
      });
    } else {
      console.log('🔍 Debug - ¡USUARIO NO ENCONTRADO EN BD!');
    }

    // ✅ USAR PERMISOS DE LA BD, NO DEL JWT
    // 🚀 DOCTORES: Siempre tienen TODOS los permisos
    const esDoctor = usuarioBD?.rol === 'DOCTOR';
    const permisos = {
      puede_editar_cobros: esDoctor ? true : (usuarioBD?.puede_editar_cobros || false),
      puede_eliminar_cobros: esDoctor ? true : (usuarioBD?.puede_eliminar_cobros || false),
      puede_ver_historial: esDoctor ? true : (usuarioBD?.puede_ver_historial || false),
      puede_gestionar_usuarios: esDoctor ? true : (usuarioBD?.puede_gestionar_usuarios || false),
      puede_gestionar_calendario: esDoctor ? true : (usuarioBD?.puede_gestionar_calendario || false),
      puede_gestionar_inventario: esDoctor ? true : (usuarioBD?.puede_gestionar_inventario || false),
      puede_ver_facturas: esDoctor ? true : (usuarioBD?.puede_ver_facturas || false),
      puede_crear_facturas: esDoctor ? true : (usuarioBD?.puede_crear_facturas || false)
    };

    // 🆕 LÓGICA PARA MÓDULOS DISPONIBLES SEGÚN PERMISOS
    const modulosDisponibles: string[] = [];
    
    // ✅ DOCTORES: Siempre tienen acceso a todo
    if (usuarioBD?.rol === 'DOCTOR') {
      modulosDisponibles.push('cobros', 'pacientes', 'citas', 'inventario', 'usuarios', 'historial', 'facturacion');
    } else {
      // ✅ OTROS ROLES: Según permisos específicos
      
      // Pacientes: Sin restricción (siempre visible)
      modulosDisponibles.push('pacientes');
      
      // Cobros: Solo si tiene permiso
      if (permisos.puede_editar_cobros) {
        modulosDisponibles.push('cobros');
      }
      
      // Usuarios: Solo si tiene permiso
      if (permisos.puede_gestionar_usuarios) {
        modulosDisponibles.push('usuarios');
      }
      
      // Calendario: Solo si tiene permiso
      if (permisos.puede_gestionar_calendario) {
        modulosDisponibles.push('citas');
      }
      
      // Inventario: Solo si tiene permiso
      if (permisos.puede_gestionar_inventario) {
        modulosDisponibles.push('inventario');
      }
      
      // Historial: Solo si tiene permiso
      if (permisos.puede_ver_historial) {
        modulosDisponibles.push('historial');
      }
      
      // Facturación: Solo si tiene permiso
      if (permisos.puede_ver_facturas || permisos.puede_crear_facturas) {
        modulosDisponibles.push('facturacion');
      }
    }
    
    const response = {
      permisos,
      modulosDisponibles,
      rol: usuarioBD?.rol || req.user.rol || 'DOCTOR',
      organizacion: req.organizacion || {
        id: 'org-123',
        nombre: 'Clínica ProCura',
        ruc: '12345678901',
        email: 'admin@procura.com',
        telefono: '+51 999 999 999',
        direccion: 'Av. Principal 123, Lima',
        color_primario: '#3B82F6',
        color_secundario: '#1F2937'
      }
    };
    
    console.log('🔍 Debug - Permisos devueltos:', response);
    console.log('🔍 Debug - Módulos disponibles:', modulosDisponibles);
    console.log('🔍 Debug - Usuario rol:', req.user.rol);
    console.log('🔍 Debug - Usuario permisos:', permisos);
    res.json(response);
  } else {
    // Fallback a datos simulados
    console.log('🔍 Debug - Usando datos simulados');
    res.json({
      permisos: {
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        puede_gestionar_calendario: true,
        puede_gestionar_inventario: true,
        puede_ver_facturas: true,
        puede_crear_facturas: true
      },
      modulosDisponibles: ['cobros', 'pacientes', 'citas', 'inventario', 'usuarios', 'historial', 'facturacion'],
      rol: 'DOCTOR',
      organizacion: {
        id: 'org-123',
        nombre: 'Clínica ProCura',
        ruc: '12345678901',
        email: 'admin@procura.com',
        telefono: '+51 999 999 999',
        direccion: 'Av. Principal 123, Lima',
        color_primario: '#3B82F6',
        color_secundario: '#1F2937'
      }
    });
  }
});

// Verificar si el usuario tiene un permiso específico
export const verificarPermiso = [
  validateParams(z.object({
    permiso: z.string().min(1, 'El permiso es requerido')
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const { permiso } = getValidatedParams(req);
    
    // Por ahora, devolver true para todos los permisos
    // En el futuro, esto debería verificar contra la base de datos
    const tienePermiso = true;
    
    res.json({ tienePermiso });
  })
];

// Obtener todos los usuarios del consultorio (solo doctores)
export const obtenerUsuariosConsultorio = asyncHandler(async (req: RequestWithTenant, res: Response) => {
  try {
    console.log('🔍 Debug - obtenerUsuariosConsultorio llamado');
    console.log('🔍 Debug - req.tenantFilter:', req.tenantFilter);
    console.log('🔍 Debug - req.user:', req.user);
    
    const organizacionId = req.tenantFilter?.organizacion_id || req.user?.organizacion_id;
    console.log('🔍 Debug - organizacionId a usar:', organizacionId);
    
    // Primero, vamos a ver qué usuarios existen en la BD
    const todosLosUsuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        organizacion_id: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true
      }
    });
    
    console.log('🔍 Debug - Todos los usuarios en BD:', todosLosUsuarios);
    
    const usuarios = await prisma.usuario.findMany({
      where: {
        // Aplicar filtro multi-tenant por organización
        organizacion_id: organizacionId
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('🔍 Debug - Usuarios encontrados con filtro:', usuarios.length);
    console.log('🔍 Debug - Usuarios filtrados:', JSON.stringify(usuarios, null, 2));
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo usuario (solo doctores)
export const crearUsuario = [
  validateBody(createUsuarioSchema),
  asyncHandler(async (req: RequestWithTenant, res: Response) => {
    const validatedData = getValidatedBody(req);
    const { nombre, apellido, email, telefono, rol, password } = validatedData;
    
    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email }
    });
    
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    

    

    
    // Determinar permisos por defecto según el rol
    const permisosPorDefecto = {
      puede_editar_cobros: rol === 'DOCTOR',
      puede_eliminar_cobros: rol === 'DOCTOR',
      puede_ver_historial: rol === 'DOCTOR',
      puede_gestionar_usuarios: rol === 'DOCTOR'
    };
    
    // Obtener consultorio_id del body si está presente
    const { consultorio_id } = req.body;
    
    // Validar que el consultorio exista si se proporciona
    if (consultorio_id) {
      const consultorio = await prisma.consultorio.findUnique({
        where: { id: consultorio_id }
      });
      if (!consultorio) {
        return res.status(400).json({ error: 'Consultorio no encontrado' });
      }
    }
    
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        rol,
        consultorio_id: consultorio_id || 'consultorio-1', // Usar el proporcionado o por defecto
        organizacion_id: req.tenantFilter?.organizacion_id || req.user?.organizacion_id || 'default',
        ...(permisosPorDefecto as any)
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        created_at: true
      }
    });
    
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
  })
];

// Actualizar usuario (solo doctores)
export const actualizarUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(updateUsuarioSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const validatedData = getValidatedBody(req);
    const { nombre, apellido, email, telefono, rol } = validatedData;
    
    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id }
    });
    
    if (!usuarioExistente) {
      throw createNotFoundError('Usuario');
    }
    
    // Si se está cambiando el email, verificar que no exista
    if (email && email !== usuarioExistente.email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: { 
          email,
          id: { not: id }
        }
      });
      
      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(email && { email }),
        ...(telefono && { telefono }),
        ...(rol && { rol })
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true,
        created_at: true
      }
    });
    
    res.json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  })
];

// Eliminar usuario (solo doctores)
export const eliminarUsuario = [
  validateParams(usuarioIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    
    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id }
    });
    
    if (!usuarioExistente) {
      throw createNotFoundError('Usuario');
    }
    
    // No permitir eliminar doctores
    if (usuarioExistente.rol === 'DOCTOR') {
      return res.status(400).json({ error: 'No se puede eliminar un doctor' });
    }
    
    await prisma.usuario.delete({
      where: { id }
    });
    
    res.json({
      message: `Usuario ${usuarioExistente.nombre} ${usuarioExistente.apellido} eliminado exitosamente`
    });
  })
];

// Actualizar permisos de un usuario (solo doctores)
export const actualizarPermisosUsuario = [
  validateParams(usuarioIdSchema),
  validateBody(updatePermisosSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = getValidatedParams(req);
    const permisos = getValidatedBody(req);
    
    console.log('🔧 Debug - actualizarPermisosUsuario llamado');
    console.log('🔧 Debug - ID del usuario:', id);
    console.log('🔧 Debug - Permisos recibidos:', permisos);
    
    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id }
    });
    
    if (!usuarioExistente) {
      throw createNotFoundError('Usuario');
    }
    
    // Preparar los datos de permisos para actualizar
    const datosPermisos: any = {};
    if (permisos.puede_editar_cobros !== undefined) {
      datosPermisos.puede_editar_cobros = permisos.puede_editar_cobros;
    }
    if (permisos.puede_eliminar_cobros !== undefined) {
      datosPermisos.puede_eliminar_cobros = permisos.puede_eliminar_cobros;
    }
    if (permisos.puede_ver_historial !== undefined) {
      datosPermisos.puede_ver_historial = permisos.puede_ver_historial;
    }
    if (permisos.puede_gestionar_usuarios !== undefined) {
      datosPermisos.puede_gestionar_usuarios = permisos.puede_gestionar_usuarios;
    }
    
    console.log('🔧 Debug - Datos de permisos preparados:', datosPermisos);
    
    const permisosActualizados = await prisma.usuario.update({
      where: { id },
      data: datosPermisos,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        puede_editar_cobros: true,
        puede_eliminar_cobros: true,
        puede_ver_historial: true,
        puede_gestionar_usuarios: true
      }
    });
    
    console.log('🔧 Debug - Permisos actualizados en BD:', permisosActualizados);
    
    res.json({
      message: 'Permisos actualizados exitosamente',
      permisos: permisosActualizados
    });
  })
];

// Obtener configuración de permisos del consultorio (solo doctores)
export const obtenerConfiguracionPermisos = asyncHandler(async (req: Request, res: Response) => {
  // Por ahora, devolver configuración por defecto
  // En el futuro, esto debería venir de la base de datos
  const configuracion = {
    secretaria_editar_cobros: true,
    secretaria_eliminar_cobros: false,
    enfermera_entradas_inventario: true,
    enfermera_salidas_inventario: true,
    secretaria_entradas_inventario: true,
    secretaria_salidas_inventario: false
  };
  
  res.json(configuracion);
});

// Actualizar configuración de permisos del consultorio (solo doctores)
export const actualizarConfiguracionPermisos = [
  validateBody(updateConfiguracionPermisosSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const configuracion = getValidatedBody(req);
    
    // Por ahora, solo devolver la configuración actualizada
    // En el futuro, esto debería guardarse en la base de datos
    res.json({
      message: 'Configuración actualizada exitosamente',
      configuracion: {
        secretaria_editar_cobros: configuracion.secretaria_editar_cobros ?? true,
        secretaria_eliminar_cobros: configuracion.secretaria_eliminar_cobros ?? false,
        enfermera_entradas_inventario: configuracion.enfermera_entradas_inventario ?? true,
        enfermera_salidas_inventario: configuracion.enfermera_salidas_inventario ?? true,
        secretaria_entradas_inventario: configuracion.secretaria_entradas_inventario ?? true,
        secretaria_salidas_inventario: configuracion.secretaria_salidas_inventario ?? false
      }
    });
  })
]; 