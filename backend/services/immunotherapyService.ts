import { PrismaClient } from '@prisma/client';

export interface ImmunotherapyRecordDto {
  pacienteId: string;
  organizacionId: string;
  fechaInicio: Date;
  editadoPor: string;
}

export interface TreatmentLogDto {
  recordId: string;
  tipoTratamiento: string;
  subtipo: string;
  unidades?: number;
  dosis: number;
  alergenos: string[];
  medicamentoReaccion?: {
    administrado: boolean;
    tipo?: string;
    dosis?: string;
    observaciones?: string;
  };
  observaciones?: string;
  userId: string;
}

export class ImmunotherapyService {
  private static instance: ImmunotherapyService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): ImmunotherapyService {
    if (!ImmunotherapyService.instance) {
      ImmunotherapyService.instance = new ImmunotherapyService();
    }
    return ImmunotherapyService.instance;
  }

  async createOrUpdateRecord(dto: ImmunotherapyRecordDto): Promise<any> {
    console.log(`🏥 [ImmunotherapyService] Iniciando createOrUpdateRecord para paciente: ${dto.pacienteId}`);
    console.log(`🔍 [ImmunotherapyService] PrismaClient disponible:`, !!this.prisma);
    
    return await this.prisma.$transaction(async (tx) => {
      try {
        console.log(`🔍 [ImmunotherapyService] Transacción iniciada, tx disponible:`, !!tx);
        if (!tx) {
          throw new Error('Transacción no disponible');
        }
        
        const existingRecord = await tx.immunotherapyRecord.findFirst({
          where: {
            pacienteId: dto.pacienteId,
            organizacionId: dto.organizacionId
          }
        });

        if (existingRecord) {
          console.log(`🔄 [ImmunotherapyService] Actualizando expediente existente: ${existingRecord.id}`);
          
          const updatedRecord = await tx.immunotherapyRecord.update({
            where: { id: existingRecord.id },
            data: {
              fechaUltimaAplicacion: new Date(),
              ultimaEdicion: new Date(),
              editadoPor: dto.editadoPor,
              updatedAt: new Date()
            }
          });

          console.log(`✅ [ImmunotherapyService] Expediente actualizado: ${updatedRecord.id}`);
          
          // Retornar con log entries incluidos
          return await tx.immunotherapyRecord.findUnique({
            where: { id: updatedRecord.id },
            include: {
              logs: {
                orderBy: { createdAt: 'desc' }
              }
            }
          });
        } else {
          console.log(`🆕 [ImmunotherapyService] Creando nuevo expediente para paciente: ${dto.pacienteId}`);
          
          const newRecord = await tx.immunotherapyRecord.create({
            data: {
              pacienteId: dto.pacienteId,
              organizacionId: dto.organizacionId,
              sedeId: dto.sedeId,
              tipoTratamiento: dto.tipoTratamiento,
              fechaInicio: dto.fechaInicio,
              fechaInicioOriginal: dto.fechaInicio,
              ultimaEdicion: new Date(),
              fechaUltimaAplicacion: dto.fechaInicio,
              editadoPor: dto.editadoPor,
              alergenos: dto.alergenos || [],
              estado: 'ACTIVO'
            }
          });

          console.log(`✅ [ImmunotherapyService] Nuevo expediente creado: ${newRecord.id}`);

          // 🎯 NO CREAR LOG ENTRY "INICIO" AUTOMÁTICAMENTE
          // Los log entries solo se crean desde EventService cuando hay tratamientos reales
          console.log('ℹ️ [ImmunotherapyService] No se crea log entry "INICIO" automático - solo se crean desde EventService');

          // Retornar expediente sin log entries (se crearán desde EventService)
          return newRecord;
        }
      } catch (error) {
        console.error(`❌ [ImmunotherapyService] Error en transacción:`, error);
        throw error;
      }
    }, {
      maxWait: 10000,
      timeout: 15000,
      isolationLevel: 'ReadCommitted'
    });
  }

  async createTreatmentLog(dto: TreatmentLogDto): Promise<any> {
    return await this.prisma.immunotherapyLog.create({
      data: {
        recordId: dto.recordId,
        tipoTratamiento: dto.tipoTratamiento,
        subtipo: dto.subtipo,
        unidades: dto.unidades,
        dosis: dto.dosis,
        alergenos: dto.alergenos,
        medicamentoReaccion: dto.medicamentoReaccion,
        reaccion: dto.reaccion,
        descripcionReaccion: dto.descripcionReaccion,
        frascos: dto.frascos,
        productId: dto.productId,
        fechaAplicacion: dto.fechaAplicacion,
        observaciones: dto.observaciones,
        userId: dto.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async getPatientRecord(pacienteId: string, organizacionId: string): Promise<any> {
    console.log(`🔍 [ImmunotherapyService] getPatientRecord - PrismaClient disponible:`, !!this.prisma);
    if (!this.prisma) {
      throw new Error('PrismaClient no disponible en getPatientRecord');
    }
    
    return await this.prisma.immunotherapyRecord.findUnique({
      where: {
        pacienteId_organizacionId: {
          pacienteId,
          organizacionId
        }
      },
      include: {
        paciente: true,
        ultimoEditor: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async getImmunotherapyLog(pacienteId: string, organizacionId: string): Promise<any[]> {
    const record = await this.getPatientRecord(pacienteId, organizacionId);
    return record?.logs || [];
  }

  /**
   * Obtiene el último tratamiento de un paciente para pre-rellenar formulario
   */
  async getLastTreatmentForPatient(pacienteId: string, organizacionId: string): Promise<any> {
    try {
      console.log(`🔍 [ImmunotherapyService] Obteniendo último tratamiento para paciente: ${pacienteId}`);
      
      // Buscar el expediente del paciente con información del paciente
      const record = await this.prisma.immunotherapyRecord.findFirst({
        where: {
          pacienteId,
          organizacionId
        },
        include: {
          paciente: {
            select: {
              nombre: true,
              apellido: true
            }
          },
          logs: {
            orderBy: {
              fechaAplicacion: 'desc'
            },
            take: 1
          }
        }
      });

      if (!record || !record.logs.length) {
        console.log(`ℹ️ [ImmunotherapyService] No se encontró expediente o tratamientos para paciente: ${pacienteId}`);
        return null;
      }

      const lastEntry = record.logs[0];
      console.log(`✅ [ImmunotherapyService] Último tratamiento encontrado:`, {
        id: lastEntry.id,
        subtipo: lastEntry.subtipo,
        unidades: lastEntry.unidades,
        dosis: lastEntry.dosis,
        alergenos: lastEntry.alergenos,
        frascos: (lastEntry as any).frascos,
        productId: (lastEntry as any).productId,
        nombrePaciente: record.paciente ? `${record.paciente.nombre} ${record.paciente.apellido}` : 'Paciente'
      });

      // Mapear los datos para el formulario
      const treatmentData = {
        subtipo: lastEntry.subtipo,
        unidades: lastEntry.unidades,
        dosis: lastEntry.dosis,
        alergenos: lastEntry.alergenos || [],
        frascos: (lastEntry as any).frascos || [],
        productId: (lastEntry as any).productId,
        observaciones: lastEntry.notas || '',
        fechaTratamiento: lastEntry.fechaAplicacion,
        nombrePaciente: record.paciente ? `${record.paciente.nombre} ${record.paciente.apellido}` : 'Paciente',
        totalTratamientos: record.logs?.length || 0
      };

      return treatmentData;
    } catch (error) {
      console.error(`❌ [ImmunotherapyService] Error obteniendo último tratamiento:`, error);
      throw error;
    }
  }

  // 🎯 MÉTODOS ADICIONALES PARA COMPATIBILIDAD
  async getRecordWithLog(pacienteId: string, organizacionId: string): Promise<any> {
    const record = await this.getPatientRecord(pacienteId, organizacionId);
    
    if (!record) return null;

    // 🎯 PROCESAR Y ENRIQUECER LOS LOG ENTRIES
    const enrichedLogEntries = (record.logs || []).map((entry: any) => {
      // 🎯 LOG ESPECÍFICO PARA DIAGNOSTICAR FRASCOS EN LA CONSULTA
      console.log('🔍 [ImmunotherapyService] DIAGNÓSTICO DE ENTRY DESDE BD:', {
        id: entry.id,
        subtipo: entry.subtipo,
        frascos: entry.frascos,
        frascosType: typeof entry.frascos,
        frascosLength: entry.frascos ? entry.frascos.length : 'N/A',
        frascosIsArray: Array.isArray(entry.frascos)
      });

      return {
        id: entry.id,
        fechaAplicacion: this.parseAndValidateDate(entry.fechaAplicacion),
        tipoTratamiento: entry.tipoTratamiento,
        subtipo: entry.subtipo,
        productId: entry.productId || null, // 🎯 AGREGADO: Incluir productId para trazabilidad
        unidades: entry.unidades || 0,
        dosis: entry.dosis || 1,
        frascos: entry.frascos || [], // 🎯 AGREGADO: Incluir campo frascos
        alergenos: entry.alergenos || [],
        medicamentoReaccion: entry.medicamentoReaccion || {},
        observaciones: entry.observaciones || '',
        descripcionReaccion: entry.descripcionReaccion || '', // 🎯 AGREGAR DESCRIPCIÓN DE REACCIÓN
        tuvoReaccion: entry.descripcionReaccion ? true : false, // 🎯 DERIVAR SI TUVO REACCIÓN
        userId: entry.userId,
        aplicadoPor: entry.user ? `${entry.user.nombre} ${entry.user.apellido}` : 'Usuario no identificado',
        aplicadoPorEmail: entry.user?.email || 'N/A',
        inventoryUsageId: entry.inventoryUsageId || null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    });

    // Asegurar que siempre tenga logs como array
    const log = enrichedLogEntries;
    
    // 🎯 CONSOLIDAR TODOS LOS ALERGENOS ÚNICOS DEL PACIENTE
    const todosLosAlergenos = new Set<string>();
    log.forEach((entry: any) => {
      if (entry.alergenos && Array.isArray(entry.alergenos)) {
        entry.alergenos.forEach((alergeno: string) => {
          if (alergeno && alergeno.trim()) {
            todosLosAlergenos.add(alergeno.trim());
          }
        });
      }
    });
    
    // 🎯 CONSOLIDAR TODAS LAS REACCIONES ÚNICAS DEL PACIENTE
    const todasLasReacciones = new Set<string>();
    log.forEach((entry: any) => {
      if (entry.descripcionReaccion && entry.descripcionReaccion.trim()) {
        todasLasReacciones.add(entry.descripcionReaccion.trim());
      }
    });
    
    console.log('🎯 [ImmunotherapyService] Alérgenos consolidados:', Array.from(todosLosAlergenos));
    console.log('🎯 [ImmunotherapyService] Reacciones consolidadas:', Array.from(todasLasReacciones));
    
    return {
      id: record.id,
      pacienteId: record.pacienteId,
      pacienteNombre: record.paciente?.nombre || 'N/A',
      pacienteApellido: record.paciente?.apellido || 'N/A',
      fechaInicio: record.fechaInicio,
      fechaInicioOriginal: record.fechaInicioOriginal,
      ultimaEdicion: record.ultimaEdicion,
      fechaUltimaAplicacion: record.fechaUltimaAplicacion,
      editadoPor: record.editadoPor,
      ultimoEditorNombre: record.ultimoEditor?.nombre || 'N/A',
      ultimoEditorApellido: record.ultimoEditor?.apellido || 'N/A',
      logs: log, // Log entries enriquecidos
      log: log, // Para compatibilidad
      totalTratamientos: log.length,
      ultimoTratamiento: log.length > 0 ? log[0] : null,
      // 🎯 AGREGAR ALERGENOS Y REACCIONES CONSOLIDADAS AL EXPEDIENTE PRINCIPAL
      alergenos: Array.from(todosLosAlergenos),
      reacciones: Array.from(todasLasReacciones)
    };
  }

  async updateStartDate(recordId: string, nuevaFecha: Date, editadoPor: string): Promise<any> {
    return await this.prisma.immunotherapyRecord.update({
      where: { id: recordId },
      data: {
        fechaInicio: nuevaFecha,
        fechaUltimaAplicacion: nuevaFecha,
        editadoPor,
        updatedAt: new Date()
      }
    });
  }

  async updateReaction(usageId: string, tuvoReaccion: boolean, descripcion?: string): Promise<any> {
    return await this.prisma.inventoryUsage.update({
      where: { id: usageId },
      data: {
        tuvoReaccion,
        descripcionReaccion: descripcion || null
      }
    });
  }

  async hasRecord(pacienteId: string, organizacionId: string): Promise<boolean> {
    const record = await this.prisma.immunotherapyRecord.findUnique({
      where: {
        pacienteId_organizacionId: {
          pacienteId,
          organizacionId
        }
      }
    });
    return !!record;
  }

  async getAllRecords(organizacionId: string): Promise<any[]> {
    return await this.prisma.immunotherapyRecord.findMany({
      where: { organizacionId },
      include: {
        paciente: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        ultimoEditor: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  // 🎯 MÉTODO PARA VALIDAR Y CONVERTIR FECHAS
  private parseAndValidateDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date(); // Fecha por defecto si no hay valor
    }
    
    if (dateValue instanceof Date) {
      return dateValue; // Ya es una fecha válida
    }
    
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ [ImmunotherapyService] Fecha inválida detectada: ${dateValue}, usando fecha por defecto`);
        return new Date(); // Fecha por defecto si el string es inválido
      }
      return parsedDate;
    }
    
    if (typeof dateValue === 'number') {
      const parsedDate = new Date(dateValue);
      if (isNaN(parsedDate.getTime())) {
        console.warn(`⚠️ [ImmunotherapyService] Timestamp inválido detectado: ${dateValue}, usando fecha por defecto`);
        return new Date(); // Fecha por defecto si el timestamp es inválido
      }
      return parsedDate;
    }
    
    console.warn(`⚠️ [ImmunotherapyService] Tipo de fecha no reconocido: ${typeof dateValue}, valor: ${dateValue}, usando fecha por defecto`);
    return new Date(); // Fecha por defecto para cualquier otro caso
  }
}
