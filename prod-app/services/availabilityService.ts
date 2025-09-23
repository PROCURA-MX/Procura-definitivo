import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AvailabilityContext {
  userId: string;
  userRole: string;
  consultorioId?: string;
  organizacionId: string;
}

export interface DoctorInfo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  consultorio_id: string;
  organizacion_id: string;
}

export interface AvailabilityResult {
  success: boolean;
  doctorId?: string;
  doctor?: DoctorInfo;
  error?: string;
  fallbackUsed?: boolean;
  metadata?: {
    source: 'direct' | 'fallback' | 'default';
    consultorioId: string;
    organizacionId: string;
  };
}

/**
 * Servicio centralizado de disponibilidad - SOLUCIÓN ROBUSTA ESTILO AMAZON
 * Maneja todos los casos edge y proporciona fallbacks automáticos
 */
export class AvailabilityService {
  
  /**
   * Obtiene el ID del doctor para mostrar disponibilidad
   * Implementa múltiples estrategias de fallback
   */
  static async getDoctorForAvailability(context: AvailabilityContext): Promise<AvailabilityResult> {
    console.log('🔍 [AvailabilityService] Iniciando búsqueda de doctor para contexto:', context);
    
    try {
      // ESTRATEGIA 1: Si es doctor, usar su propio ID
      if (context.userRole === 'DOCTOR') {
        console.log('✅ [AvailabilityService] Usuario es doctor, usando su propio ID');
        return {
          success: true,
          doctorId: context.userId,
          metadata: {
            source: 'direct',
            consultorioId: context.consultorioId || '',
            organizacionId: context.organizacionId
          }
        };
      }
      
      // ESTRATEGIA 2: Buscar doctor en el consultorio específico
      if (context.consultorioId) {
        const doctor = await this.findDoctorInConsultorio(context.consultorioId, context.organizacionId);
        if (doctor) {
          console.log('✅ [AvailabilityService] Doctor encontrado en consultorio específico:', doctor.id);
          return {
            success: true,
            doctorId: doctor.id,
            doctor: doctor,
            metadata: {
              source: 'direct',
              consultorioId: context.consultorioId,
              organizacionId: context.organizacionId
            }
          };
        }
      }
      
      // ESTRATEGIA 3: Fallback - Buscar cualquier doctor en la organización
      console.log('⚠️ [AvailabilityService] No se encontró doctor en consultorio específico, usando fallback');
      const fallbackDoctor = await this.findAnyDoctorInOrganization(context.organizacionId);
      if (fallbackDoctor) {
        console.log('✅ [AvailabilityService] Doctor encontrado en fallback:', fallbackDoctor.id);
        return {
          success: true,
          doctorId: fallbackDoctor.id,
          doctor: fallbackDoctor,
          fallbackUsed: true,
          metadata: {
            source: 'fallback',
            consultorioId: context.consultorioId || fallbackDoctor.consultorio_id,
            organizacionId: context.organizacionId
          }
        };
      }
      
      // ESTRATEGIA 4: Último recurso - Crear doctor por defecto
      console.log('⚠️ [AvailabilityService] No se encontró ningún doctor, creando por defecto');
      const defaultDoctor = await this.createDefaultDoctor(context.organizacionId, context.consultorioId);
      if (defaultDoctor) {
        console.log('✅ [AvailabilityService] Doctor por defecto creado:', defaultDoctor.id);
        return {
          success: true,
          doctorId: defaultDoctor.id,
          doctor: defaultDoctor,
          fallbackUsed: true,
          metadata: {
            source: 'default',
            consultorioId: context.consultorioId || defaultDoctor.consultorio_id,
            organizacionId: context.organizacionId
          }
        };
      }
      
      // Si llegamos aquí, algo está muy mal
      console.error('❌ [AvailabilityService] No se pudo obtener doctor por ningún método');
      return {
        success: false,
        error: 'No se pudo determinar el doctor para mostrar disponibilidad',
        metadata: {
          source: 'direct',
          consultorioId: context.consultorioId || '',
          organizacionId: context.organizacionId
        }
      };
      
    } catch (error) {
      console.error('❌ [AvailabilityService] Error interno:', error);
      return {
        success: false,
        error: 'Error interno del servidor',
        metadata: {
          source: 'direct',
          consultorioId: context.consultorioId || '',
          organizacionId: context.organizacionId
        }
      };
    }
  }
  
  /**
   * Busca un doctor en un consultorio específico
   */
  private static async findDoctorInConsultorio(consultorioId: string, organizacionId: string): Promise<DoctorInfo | null> {
    try {
      console.log('🔍 [AvailabilityService] Buscando doctor en consultorio:', consultorioId);
      
      const doctor = await prisma.usuario.findFirst({
        where: {
          consultorio_id: consultorioId,
          rol: 'DOCTOR',
          organizacion_id: organizacionId
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          consultorio_id: true,
          organizacion_id: true
        }
      });
      
      if (doctor) {
        console.log('✅ [AvailabilityService] Doctor encontrado en consultorio:', doctor.id);
      } else {
        console.log('⚠️ [AvailabilityService] No se encontró doctor en consultorio:', consultorioId);
      }
      
      return doctor;
    } catch (error) {
      console.error('❌ [AvailabilityService] Error buscando doctor en consultorio:', error);
      return null;
    }
  }
  
  /**
   * Busca cualquier doctor en la organización (fallback)
   */
  private static async findAnyDoctorInOrganization(organizacionId: string): Promise<DoctorInfo | null> {
    try {
      console.log('🔍 [AvailabilityService] Buscando cualquier doctor en organización:', organizacionId);
      
      const doctor = await prisma.usuario.findFirst({
        where: {
          rol: 'DOCTOR',
          organizacion_id: organizacionId
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          consultorio_id: true,
          organizacion_id: true
        },
        orderBy: {
          created_at: 'asc' // Tomar el doctor más antiguo (más estable)
        }
      });
      
      if (doctor) {
        console.log('✅ [AvailabilityService] Doctor encontrado en organización:', doctor.id);
      } else {
        console.log('⚠️ [AvailabilityService] No se encontró ningún doctor en organización:', organizacionId);
      }
      
      return doctor;
    } catch (error) {
      console.error('❌ [AvailabilityService] Error buscando doctor en organización:', error);
      return null;
    }
  }
  
  /**
   * Crea un doctor por defecto si no existe ninguno
   */
  private static async createDefaultDoctor(organizacionId: string, consultorioId?: string): Promise<DoctorInfo | null> {
    try {
      console.log('🔍 [AvailabilityService] Creando doctor por defecto para organización:', organizacionId);
      
      // Verificar si ya existe un doctor por defecto
      const existingDefault = await prisma.usuario.findFirst({
        where: {
          email: 'doctor-default@procura.com',
          organizacion_id: organizacionId
        }
      });
      
      if (existingDefault) {
        console.log('✅ [AvailabilityService] Doctor por defecto ya existe:', existingDefault.id);
        return {
          id: existingDefault.id,
          nombre: existingDefault.nombre || 'Doctor',
          apellido: existingDefault.apellido || 'Por Defecto',
          email: existingDefault.email,
          rol: existingDefault.rol,
          consultorio_id: existingDefault.consultorio_id || '',
          organizacion_id: existingDefault.organizacion_id
        };
      }
      
      // Crear nuevo doctor por defecto
      const newDoctor = await prisma.usuario.create({
        data: {
          nombre: 'Doctor',
          apellido: 'Por Defecto',
          email: 'doctor-default@procura.com',
          telefono: '000-000-0000',
          password: '$2b$10$default.hash.for.default.doctor', // Hash por defecto
          rol: 'DOCTOR',
          organizacion_id: organizacionId,
          consultorio_id: consultorioId || 'default-consultorio-id',
          puede_gestionar_calendario: true,
          puede_editar_cobros: true,
          puede_eliminar_cobros: true,
          puede_gestionar_usuarios: true,
          puede_ver_historial: true,
          puede_gestionar_inventario: false,
          puede_crear_facturas: false,
          puede_ver_facturas: false
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          consultorio_id: true,
          organizacion_id: true
        }
      });
      
      console.log('✅ [AvailabilityService] Doctor por defecto creado exitosamente:', newDoctor.id);
      return newDoctor;
      
    } catch (error) {
      console.error('❌ [AvailabilityService] Error creando doctor por defecto:', error);
      return null;
    }
  }
  
  /**
   * Health check del servicio
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string; details: any }> {
    try {
      const doctorCount = await prisma.usuario.count({
        where: { rol: 'DOCTOR' }
      });
      
      const consultorioCount = await prisma.consultorio.count();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          totalDoctors: doctorCount,
          totalConsultorios: consultorioCount,
          service: 'AvailabilityService'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          service: 'AvailabilityService'
        }
      };
    }
  }
}
