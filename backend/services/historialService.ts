import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HistorialData {
  entidad: string;           // 'cobro', 'paciente', 'usuario', etc.
  entidad_id: string;        // ID de la entidad
  usuario_id: string;        // ID del usuario que hace el cambio
  tipo_cambio: 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ACTUALIZACION';
  detalles_antes?: any;      // Estado anterior (opcional)
  detalles_despues: any;     // Estado nuevo
  descripcion?: string;      // Descripción opcional del cambio
  ip_address?: string;       // IP del usuario (opcional)
  user_agent?: string;       // User agent del navegador (opcional)
  organizacion_id?: string;  // ID de la organización (multi-tenancy)
}

export class HistorialService {
  /**
   * Registra un cambio en el historial
   */
  static async registrarCambio(data: HistorialData): Promise<void> {
    try {
      console.log('🔍 DEBUG - registrarCambio iniciado');
      console.log('📝 Registrando cambio en historial:', {
        entidad: data.entidad,
        entidad_id: data.entidad_id,
        tipo_cambio: data.tipo_cambio,
        usuario_id: data.usuario_id,
        organizacion_id: data.organizacion_id
      });

      // Crear el registro de historial
      console.log('🔍 DEBUG - Creando registro en historialCobro con datos:', {
        cobro_id: data.entidad_id,
        usuario_id: data.usuario_id,
        tipo_cambio: data.tipo_cambio,
        organizacion_id: data.organizacion_id
      });
      
      // Usar la fecha actual sin ajustes manuales
      const fechaLocal = new Date();
      
      const registroCreado = await prisma.historialCobro.create({
        data: {
          cobro_id: data.entidad_id,
          usuario_id: data.usuario_id,
          tipo_cambio: data.tipo_cambio,
          detalles_antes: data.detalles_antes || null,
          detalles_despues: data.detalles_despues,
          organizacion_id: data.organizacion_id,
          created_at: fechaLocal,
        },
      });

      console.log('✅ Cambio registrado exitosamente con ID:', registroCreado.id);
    } catch (error: any) {
      console.error('❌ Error registrando cambio en historial:', error);
      
      // Si es un error de conexión a la base de datos, solo logear y continuar
      if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
        console.log('⚠️ Error de conexión a la base de datos - no se pudo registrar el historial');
        return;
      }
      
      // Para otros errores, solo logear y continuar (no interrumpir la operación principal)
      console.log('⚠️ Error registrando historial, pero continuando con la operación principal');
    }
  }

  /**
   * Registra la creación de un cobro
   */
  static async registrarCreacionCobro(
    cobroId: string, 
    usuarioId: string, 
    datosCobro: any,
    organizacionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    console.log('🔍 DEBUG - registrarCreacionCobro llamado con:', { cobroId, usuarioId, organizacionId });
    
    // Asegurar que la fecha_cobro esté incluida en los detalles
    const detallesConFecha = {
      ...datosCobro,
      fecha_cobro: datosCobro.fecha_cobro || new Date().toISOString()
    };
    
    await this.registrarCambio({
      entidad: 'cobro',
      entidad_id: cobroId,
      usuario_id: usuarioId,
      tipo_cambio: 'CREACION',
      detalles_despues: detallesConFecha,
      descripcion: 'Cobro creado',
      organizacion_id: organizacionId,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Registra la edición de un cobro
   */
  static async registrarEdicionCobro(
    cobroId: string,
    usuarioId: string,
    datosAnteriores: any,
    datosNuevos: any,
    organizacionId?: string,
    descripcion?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.registrarCambio({
      entidad: 'cobro',
      entidad_id: cobroId,
      usuario_id: usuarioId,
      tipo_cambio: 'EDICION',
      detalles_antes: datosAnteriores,
      detalles_despues: datosNuevos,
      descripcion: descripcion || 'Cobro editado',
      organizacion_id: organizacionId,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Registra la eliminación de un cobro
   */
  static async registrarEliminacionCobro(
    cobroId: string,
    usuarioId: string,
    datosCobro: any,
    organizacionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.registrarCambio({
      entidad: 'cobro',
      entidad_id: cobroId,
      usuario_id: usuarioId,
      tipo_cambio: 'ELIMINACION',
      detalles_antes: datosCobro,
      detalles_despues: { estado: 'ELIMINADO' },
      descripcion: 'Cobro eliminado',
      organizacion_id: organizacionId,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Registra el cambio de estado de un cobro
   */
  static async registrarCambioEstadoCobro(
    cobroId: string,
    usuarioId: string,
    estadoAnterior: string,
    estadoNuevo: string,
    organizacionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.registrarCambio({
      entidad: 'cobro',
      entidad_id: cobroId,
      usuario_id: usuarioId,
      tipo_cambio: 'ACTUALIZACION',
      detalles_antes: { estado: estadoAnterior },
      detalles_despues: { estado: estadoNuevo },
      descripcion: `Estado cambiado de ${estadoAnterior} a ${estadoNuevo}`,
      organizacion_id: organizacionId,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Obtiene el historial de un cobro específico
   */
  static async obtenerHistorialCobro(cobroId: string, organizacionId?: string) {
    try {
      const where: any = { cobro_id: cobroId };
      
      // Aplicar filtro de organización si se proporciona
      if (organizacionId) {
        where.organizacion_id = organizacionId;
      }

      const historial = await prisma.historialCobro.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      return historial.map(registro => ({
        ...registro,
        detalles_antes: registro.detalles_antes,
        detalles_despues: registro.detalles_despues
      }));
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de todos los cobros con filtros
   */
  static async obtenerHistorialGeneral(filtros?: {
    fechaDesde?: Date;
    fechaHasta?: Date;
    usuarioId?: string;
    tipoCambio?: string;
    limit?: number;
    offset?: number;
    organizacionId?: string;
  }) {
    console.log('🔍 DEBUG - obtenerHistorialGeneral llamado con filtros:', JSON.stringify(filtros, null, 2));
    try {
      const where: any = {};

      // Para filtros de fecha, buscar solo por created_at del historial
      if (filtros?.fechaDesde || filtros?.fechaHasta) {
        console.log('🔍 DEBUG - Aplicando filtros de fecha por created_at');
        
        where.created_at = {};
        if (filtros.fechaDesde) {
          // Para fechaDesde, buscar desde el inicio del día anterior (para incluir registros que están en UTC del día siguiente)
          const fechaDesde = new Date(filtros.fechaDesde);
          fechaDesde.setDate(fechaDesde.getDate() - 1); // Restar un día
          fechaDesde.setHours(0, 0, 0, 0); // 00:00:00.000
          where.created_at.gte = fechaDesde;
          console.log('🔍 DEBUG - Filtro fechaDesde ajustado:', fechaDesde);
        }
        if (filtros.fechaHasta) {
          // Para fechaHasta, buscar hasta el final del día siguiente (para incluir registros que están en UTC del día siguiente)
          const fechaHasta = new Date(filtros.fechaHasta);
          fechaHasta.setDate(fechaHasta.getDate() + 1); // Sumar un día
          fechaHasta.setHours(23, 59, 59, 999); // 23:59:59.999
          where.created_at.lte = fechaHasta;
          console.log('🔍 DEBUG - Filtro fechaHasta ajustado:', fechaHasta);
        }
        
        console.log('🔍 DEBUG - Where clause para fechas:', where.created_at);
      }

      if (filtros?.usuarioId) {
        where.usuario_id = filtros.usuarioId;
      }

      if (filtros?.tipoCambio) {
        where.tipo_cambio = filtros.tipoCambio;
      }

      // Aplicar filtro de organización si se proporciona
      if (filtros?.organizacionId) {
        console.log('🔍 DEBUG - Aplicando filtro de organización:', filtros.organizacionId);
        where.organizacion_id = filtros.organizacionId;
      }

      const historial = await prisma.historialCobro.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          cobro: {
            include: {
              paciente: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: filtros?.limit || 50,
        skip: filtros?.offset || 0
      });

      console.log('🔍 DEBUG - Historial encontrado:', historial.length, 'registros');
      if (historial.length > 0) {
        console.log('🔍 DEBUG - Primer registro created_at:', historial[0].created_at);
        console.log('🔍 DEBUG - Primer registro tipo_cambio:', historial[0].tipo_cambio);
      } else {
        console.log('🔍 DEBUG - No hay registros encontrados');
      }

      return historial.map(registro => ({
        ...registro,
        detalles_antes: registro.detalles_antes,
        detalles_despues: registro.detalles_despues
      }));
    } catch (error: any) {
      console.error('❌ Error obteniendo historial general:', error);
      
      // Si es un error de conexión a la base de datos, retornar array vacío en lugar de fallar
      if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
        console.log('⚠️ Error de conexión a la base de datos - retornando array vacío');
        return [];
      }
      
      // Para otros errores, lanzar el error
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del historial
   */
  static async obtenerEstadisticasHistorial(organizacionId?: string) {
    try {
      const where: any = {};
      
      // Aplicar filtro de organización si se proporciona
      if (organizacionId) {
        where.organizacion_id = organizacionId;
      }

      const [
        totalRegistros,
        cambiosPorTipo,
        cambiosPorUsuario,
        cambiosPorDia
      ] = await Promise.all([
        // Total de registros
        prisma.historialCobro.count({ where }),
        
        // Cambios por tipo
        prisma.historialCobro.groupBy({
          by: ['tipo_cambio'],
          where,
          _count: { tipo_cambio: true }
        }),
        
        // Cambios por usuario (top 10)
        prisma.historialCobro.groupBy({
          by: ['usuario_id'],
          where,
          _count: { usuario_id: true },
          orderBy: { _count: { usuario_id: 'desc' } },
          take: 10
        }),
        
        // Cambios por día (últimos 30 días) - Versión simplificada
        prisma.historialCobro.findMany({
          where: {
            ...where,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 días atrás
            }
          },
          select: {
            created_at: true
          }
        })
      ]);

      return {
        totalRegistros,
        cambiosPorTipo,
        cambiosPorUsuario,
        cambiosPorDia
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}


