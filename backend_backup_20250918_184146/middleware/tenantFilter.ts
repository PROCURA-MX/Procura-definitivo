import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de filtrado automático por organización
 * Garantiza que todas las consultas respeten el multi-tenancy
 */
export function tenantFilter(req: Request, res: Response, next: NextFunction) {
  try {
    const organizacionId = (req as any).organizationId;
    
    if (!organizacionId) {
      console.warn('⚠️ [TenantFilter] No se encontró organizationId en la request');
      return next();
    }

    // Agregar filtro de organización a la request
    (req as any).tenantFilter = {
      organizacion_id: organizacionId
    };

    console.log(`🔒 [TenantFilter] Aplicando filtro de organización: ${organizacionId}`);
    next();
  } catch (error) {
    console.error('❌ [TenantFilter] Error:', error);
    next(error);
  }
}

/**
 * Función helper para aplicar filtro de organización a consultas Prisma
 */
export function applyTenantFilter<T extends Record<string, any>>(
  whereClause: T,
  organizacionId: string
): T & { organizacion_id: string } {
  return {
    ...whereClause,
    organizacion_id: organizacionId
  };
}

/**
 * Función helper para validar que una consulta incluye filtro de organización
 */
export function validateTenantFilter(whereClause: any, organizacionId: string): boolean {
  if (!whereClause.organizacion_id) {
    console.error(`❌ [TenantFilter] Consulta sin filtro de organización:`, whereClause);
    return false;
  }
  
  if (whereClause.organizacion_id !== organizacionId) {
    console.error(`❌ [TenantFilter] Filtro de organización incorrecto. Esperado: ${organizacionId}, Recibido: ${whereClause.organizacion_id}`);
    return false;
  }
  
  return true;
}
