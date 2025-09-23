import express from 'express';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';
import prisma from '../prisma';
import { z } from 'zod';
import { obtenerMisPermisos } from '../controllers/permisosController';

const router = express.Router();

// GET /mis-permisos - Obtener permisos del usuario actual
router.get('/mis-permisos', authenticateMultiTenant, obtenerMisPermisos);

// GET /usuarios - Obtener lista de usuarios (para gestión de permisos)
router.get('/usuarios', authenticateMultiTenant, async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    const organizacionId = (req as any).organizationId;
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar si el usuario tiene permisos para gestionar usuarios
    // Permitir a DOCTORES o usuarios con puede_gestionar_usuarios: true
    if (authenticatedUser.rol !== 'DOCTOR') {
      // Si no es DOCTOR, verificar si tiene el permiso específico
      const usuarioBD = await prisma.usuario.findUnique({
        where: { id: authenticatedUser.id },
        select: { puede_gestionar_usuarios: true }
      });
      
      if (!usuarioBD?.puede_gestionar_usuarios) {
        return res.status(403).json({ error: 'No tienes permisos para acceder a esta sección' });
      }
    }

    // Obtener usuarios de la organización con sus permisos
    const usuarios = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.email, 
        u.telefono, 
        u.rol, 
        u.consultorio_id, 
        u.created_at, 
        u.updated_at, 
        c.nombre as consultorio_nombre,
        u.puede_editar_cobros,
        u.puede_eliminar_cobros,
        u.puede_gestionar_usuarios,
        u.puede_ver_historial,
        u.puede_gestionar_calendario,
        u.puede_gestionar_inventario,
        u.puede_ver_facturas,
        u.puede_crear_facturas
      FROM usuarios u
      LEFT JOIN consultorios c ON u.consultorio_id = c.id
      WHERE u.organizacion_id = ${organizacionId}::uuid
      ORDER BY u.nombre, u.apellido
      LIMIT 50
    ` as any[];

    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /usuarios/:userId/permisos - Actualizar permisos de un usuario
router.put('/usuarios/:userId/permisos', authenticateMultiTenant, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permisos } = req.body;
    const authenticatedUser = (req as any).user;
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario autenticado sea DOCTOR
    if (authenticatedUser.rol !== 'DOCTOR') {
      return res.status(403).json({ error: 'Solo los doctores pueden gestionar permisos' });
    }

    // Verificar que el usuario a modificar existe y pertenece a la misma organización
    const usuario = await prisma.usuario.findFirst({
      where: { 
        id: userId,
        organizacion_id: (req as any).organizationId
      },
      select: { id: true, rol: true, nombre: true, apellido: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // NO PERMITIR MODIFICAR PERMISOS DE DOCTORES
    if (usuario.rol === 'DOCTOR') {
      return res.status(400).json({ 
        error: 'No se pueden modificar los permisos de un doctor',
        message: 'Los doctores tienen acceso total por defecto'
      });
    }

    // Actualizar permisos del usuario (solo para roles que no sean DOCTOR)
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        puede_editar_cobros: permisos.puede_editar_cobros || false,
        puede_eliminar_cobros: permisos.puede_eliminar_cobros || false,
        puede_gestionar_usuarios: permisos.puede_gestionar_usuarios || false,
        puede_ver_historial: permisos.puede_ver_historial || false,
        puede_gestionar_calendario: permisos.puede_gestionar_calendario || false,
        puede_gestionar_inventario: permisos.puede_gestionar_inventario || false,
        puede_ver_facturas: permisos.puede_ver_facturas || false,
        puede_crear_facturas: permisos.puede_crear_facturas || false
      }
    });

    console.log(`🔐 Permisos actualizados para usuario: ${usuario.nombre} ${usuario.apellido} (${usuario.rol}) por doctor: ${authenticatedUser.email}`);

    res.json({ 
      message: 'Permisos actualizados exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error actualizando permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Esquema de validación robusto para creación de usuarios
// 🚀 SOLUCIÓN ROBUSTA: Aceptar ambos nombres de campo (consultorioId y consultorio_id)
const CreateUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es demasiado largo'),
  email: z.string().email('Email inválido').max(255, 'El email es demasiado largo'),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').max(20, 'El teléfono es demasiado largo'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(255, 'La contraseña es demasiado larga'),
  rol: z.enum(['DOCTOR', 'SECRETARIA', 'ENFERMERA']),
  // 🚀 SOLUCIÓN ROBUSTA: Aceptar ambos nombres de campo
  consultorioId: z.string().uuid('ID de consultorio inválido').optional(),
  consultorio_id: z.string().uuid('ID de consultorio inválido').optional()
}).refine((data) => {
  // 🚀 SOLUCIÓN ROBUSTA: Al menos uno de los dos campos debe estar presente
  return data.consultorioId || data.consultorio_id;
}, {
  message: 'ID de consultorio es requerido',
  path: ['consultorioId']
});

// POST /usuarios - Crear nuevo usuario con validación robusta
router.post('/usuarios', authenticateMultiTenant, async (req, res) => {
  try {
    console.log('🔍 [POST /usuarios] Iniciando creación de usuario');
    console.log('📥 [POST /usuarios] Body recibido:', JSON.stringify(req.body, null, 2));
    
    const authenticatedUser = (req as any).user;
    const organizacionId = (req as any).organizationId;
    
    if (!authenticatedUser) {
      console.log('❌ [POST /usuarios] Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el usuario autenticado sea DOCTOR
    if (authenticatedUser.rol !== 'DOCTOR') {
      console.log(`❌ [POST /usuarios] Usuario ${authenticatedUser.email} (${authenticatedUser.rol}) no tiene permisos para crear usuarios`);
      return res.status(403).json({ error: 'Solo los doctores pueden crear usuarios' });
    }

    console.log(`✅ [POST /usuarios] Usuario autenticado: ${authenticatedUser.email} (${authenticatedUser.rol})`);

    // Validación robusta con Zod
    const validationResult = CreateUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log('❌ [POST /usuarios] Validación fallida:', validationResult.error.issues);
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: validationResult.error.issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { nombre, apellido, email, telefono, password, rol, consultorioId, consultorio_id } = validationResult.data;
    
    // 🚀 SOLUCIÓN ROBUSTA: Normalizar el campo de consultorio
    const consultorioIdNormalizado = consultorioId || consultorio_id;
    console.log(`✅ [POST /usuarios] Validación exitosa para usuario: ${nombre} ${apellido}`);
    console.log(`🔍 [POST /usuarios] Consultorio ID normalizado: ${consultorioIdNormalizado}`);

    // Verificar que el email no esté duplicado
    const existingUser = await prisma.usuario.findFirst({
      where: { 
        email,
        organizacion_id: organizacionId
      }
    });

    if (existingUser) {
      console.log(`❌ [POST /usuarios] Email duplicado: ${email}`);
      return res.status(400).json({ 
        error: 'Ya existe un usuario con este email en la organización' 
      });
    }

    // Verificar que el consultorio pertenezca a la organización
    const consultorio = await prisma.consultorio.findFirst({
      where: { 
        id: consultorioIdNormalizado,
        organizacion_id: organizacionId
      }
    });

    if (!consultorio) {
      console.log(`❌ [POST /usuarios] Consultorio no encontrado o no pertenece a la organización: ${consultorioIdNormalizado}`);
      return res.status(400).json({ 
        error: 'El consultorio seleccionado no pertenece a esta organización' 
      });
    }

    console.log(`✅ [POST /usuarios] Consultorio validado: ${consultorio.nombre}`);

    // Crear el nuevo usuario
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        password, // En producción, esto debería estar hasheado
        rol,
        consultorio_id: consultorioIdNormalizado,
        organizacion_id: organizacionId,
        // Permisos por defecto según el rol
        puede_editar_cobros: rol === 'SECRETARIA',
        puede_eliminar_cobros: false, // Solo doctores pueden eliminar
        puede_gestionar_usuarios: false, // Solo doctores pueden gestionar
        puede_ver_historial: true
      }
    });

    console.log(`✅ [POST /usuarios] Usuario creado exitosamente: ${nombre} ${apellido} (${rol}) por doctor: ${authenticatedUser.email}`);

    // NO devolver la contraseña en la respuesta
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      usuario: userResponse
    });
  } catch (error) {
    console.error('❌ [POST /usuarios] Error interno:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 
 
 
 
 