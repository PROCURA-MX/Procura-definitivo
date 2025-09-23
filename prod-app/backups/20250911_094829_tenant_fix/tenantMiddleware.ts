import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

  interface AuthenticatedRequest extends Request {
    user?: any;
    userId?: string;
    email?: string;
    sedeId?: string;
    userConsultorioId?: string;
    tenantId?: string;
    organizationId?: string;
    tenantFilter?: any;
  }

/**
 * Middleware robusto de multi-tenancy para producción
 * Maneja autenticación y mapeo de organización a sedeId
 */
export async function authenticateMultiTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Verificar token de autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // 2. Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded;

    // 3. Obtener información del usuario desde la base de datos
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        organizacion_id: true,
        rol: true,
        consultorio_id: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // 4. Determinar sedeId - PRIORIZAR EL DEL FRONTEND SI ESTÁ DISPONIBLE
    let sedeId: string;
    
    // Verificar si hay sedeId en el body o query params (del frontend)
    const frontendSedeId = req.body?.sedeId || req.query?.sedeId;
    
    if (frontendSedeId && typeof frontendSedeId === 'string') {
      // USAR EL SEDEID DEL FRONTEND
      sedeId = frontendSedeId;
      console.log('🔍 Tenant Middleware - Usando sedeId del frontend:', sedeId);
    } else {
      // USAR EL MAPEO DE ORGANIZACIÓN (fallback)
      sedeId = mapOrganizationToSedeId(user.organizacion_id);
      console.log('🔍 Tenant Middleware - Usando sedeId del mapeo:', sedeId);
    }
    
    // 5. Agregar información de tenant a la request
    req.tenantId = sedeId;
    req.organizationId = user.organizacion_id;
    req.tenantFilter = { organizacion_id: user.organizacion_id };
    req.user = { ...req.user, ...user, sedeId };
    
    // 6. Asignar propiedades directamente al objeto req para compatibilidad
    req.userId = user.id;
    req.email = user.email;
    req.sedeId = sedeId;
    req.userConsultorioId = user.consultorio_id;

    console.log('🔍 Tenant Middleware - Valores asignados:', {
      tenantId: req.tenantId,
      organizationId: req.organizationId,
      sedeId: sedeId,
      userConsultorioId: user.consultorio_id
    });

    console.log('🔍 Tenant Middleware - Mapeo aplicado:', {
      inputOrganizationId: user.organizacion_id,
      outputSedeId: sedeId,
      mapeoCorrecto: sedeId === 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21'
    });

    console.log('🔍 Tenant Middleware - Valores asignados:', {
      tenantId: req.tenantId,
      organizationId: req.organizationId,
      sedeId: sedeId,
      userConsultorioId: user.consultorio_id
    });

    console.log('🔍 Tenant Middleware:', {
      userId: user.id,
      email: user.email,
      organizationId: user.organizacion_id,
      sedeId,
      rol: user.rol
    });

    next();
  } catch (error) {
    console.error('❌ Error en Tenant Middleware:', error);
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Mapea la organización del usuario al sedeId correspondiente
 */
function mapOrganizationToSedeId(organizationId: string): string {
  switch (organizationId) {
    case '550e8400-e29b-41d4-a716-446655440000': // Clínica ProCura
      return 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21'; // Clínica Dr. García
    case '550e8400-e29b-41d4-a716-446655440001': // Consultorio de Prueba
      return 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21'; // Usar la misma sede
    default:
      // Para cualquier organización no mapeada, usar el default
      console.warn(`⚠️ Organización no mapeada: ${organizationId}, usando sede por defecto`);
      return 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21';
  }
}

/**
 * Middleware para verificar permisos específicos
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar si el usuario tiene el permiso requerido
    const hasPermission = req.user[permission];
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Permiso insuficiente',
        required: permission,
        user: req.user.email
      });
    }

    next();
  };
}

/**
 * Middleware para verificar rol específico
 */
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (req.user.rol !== role) {
      return res.status(403).json({ 
        error: 'Rol insuficiente',
        required: role,
        current: req.user.rol
      });
    }

    next();
  };
}

/**
 * Middleware para rutas que no requieren autenticación pero sí filtrado por organización
 * (ej: webhooks, endpoints públicos)
 */
export function filterByOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const organizacionId = req.headers['x-organizacion-id'] as string;
  
  if (!organizacionId) {
    return res.status(400).json({ error: 'ID de organización requerido' });
  }
  
  req.tenantFilter = { organizacion_id: organizacionId };
  next();
}

/**
 * Middleware para verificar que el usuario pertenece a la organización correcta
 */
export function verifyOrganizationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.user;
  const organizacionId = req.params.organizacionId || req.body.organizacion_id;
  
  if (!user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (organizacionId && user.organizacion_id !== organizacionId) {
    return res.status(403).json({ error: 'Acceso denegado a esta organización' });
  }
  
  next();
}

/**
 * Función helper para aplicar filtros de tenant a consultas Prisma
 */
export function applyTenantFilter(baseWhere: any = {}, tenantFilter: any) {
  return {
    ...baseWhere,
    ...tenantFilter
  };
}

/**
 * Función helper para validar que un recurso pertenece a la organización del usuario
 */
export async function validateResourceOwnership(
  model: any, 
  resourceId: string, 
  organizacionId: string
): Promise<boolean> {
  const resource = await model.findFirst({
    where: {
      id: resourceId,
      organizacion_id: organizacionId
    }
  });
  
  return !!resource;
} 