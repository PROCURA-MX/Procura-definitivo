import { PrismaClient } from '@prisma/client';

/**
 * Servicio centralizado para consultas con filtrado automático por organización
 * Garantiza que todas las consultas respeten el multi-tenancy
 */
export class TenantQueryService {
  private static prisma = new PrismaClient();

  /**
   * Buscar múltiples registros con filtro automático de organización
   */
  static async findMany<T>(
    model: any,
    organizacionId: string,
    options: any = {}
  ): Promise<T[]> {
    const whereClause = {
      ...options.where,
      organizacion_id: organizacionId
    };

    console.log(`🔍 [TenantQueryService] findMany - Organización: ${organizacionId}`);
    
    return model.findMany({
      ...options,
      where: whereClause
    });
  }

  /**
   * Buscar un registro único con filtro automático de organización
   */
  static async findUnique<T>(
    model: any,
    organizacionId: string,
    options: any = {}
  ): Promise<T | null> {
    const whereClause = {
      ...options.where,
      organizacion_id: organizacionId
    };

    console.log(`🔍 [TenantQueryService] findUnique - Organización: ${organizacionId}`);
    
    return model.findUnique({
      ...options,
      where: whereClause
    });
  }

  /**
   * Contar registros con filtro automático de organización
   */
  static async count(
    model: any,
    organizacionId: string,
    options: any = {}
  ): Promise<number> {
    const whereClause = {
      ...options.where,
      organizacion_id: organizacionId
    };

    console.log(`🔍 [TenantQueryService] count - Organización: ${organizacionId}`);
    
    return model.count({
      ...options,
      where: whereClause
    });
  }

  /**
   * Crear registro con organización automática
   */
  static async create<T>(
    model: any,
    organizacionId: string,
    data: any
  ): Promise<T> {
    const createData = {
      ...data,
      organizacion_id: organizacionId
    };

    console.log(`➕ [TenantQueryService] create - Organización: ${organizacionId}`);
    
    return model.create({
      data: createData
    });
  }

  /**
   * Actualizar registro con validación de organización
   */
  static async update<T>(
    model: any,
    organizacionId: string,
    where: any,
    data: any
  ): Promise<T> {
    const whereClause = {
      ...where,
      organizacion_id: organizacionId
    };

    console.log(`✏️ [TenantQueryService] update - Organización: ${organizacionId}`);
    
    return model.update({
      where: whereClause,
      data: data
    });
  }

  /**
   * Eliminar registro con validación de organización
   */
  static async delete<T>(
    model: any,
    organizacionId: string,
    where: any
  ): Promise<T> {
    const whereClause = {
      ...where,
      organizacion_id: organizacionId
    };

    console.log(`🗑️ [TenantQueryService] delete - Organización: ${organizacionId}`);
    
    return model.delete({
      where: whereClause
    });
  }
}
