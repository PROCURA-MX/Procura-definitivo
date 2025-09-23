import { PrismaClient } from '@prisma/client';

export interface EventData {
  id: string;
  event: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export class EventService {
  private static instance: EventService;
  private eventQueue: EventData[] = [];
  private isProcessing = false;
  private prisma: PrismaClient;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 segundos
  
  // 🎯 SISTEMA DE LOCKS PARA EVITAR DUPLICADOS
  private processingLocks = new Map<string, boolean>();
  private lockTimeout = 30000; // 30 segundos

  private constructor() {
    console.log('🏗️ [EventService] Constructor iniciado');
    this.prisma = new PrismaClient();
    console.log('🏗️ [EventService] PrismaClient creado');
    this.startProcessing();
    console.log('🏗️ [EventService] Procesamiento iniciado');
  }

  public static getInstance(): EventService {
    console.log('🔍 [EventService] getInstance() llamado');
    if (!EventService.instance) {
      console.log('🔍 [EventService] Creando nueva instancia');
      EventService.instance = new EventService();
    } else {
      console.log('🔍 [EventService] Usando instancia existente');
    }
    return EventService.instance;
  }

  public async addEvent(event: string, data: any): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const eventData: EventData = {
      id: eventId,
      event,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      status: 'pending'
    };

    this.eventQueue.push(eventData);
    console.log(`🎯 [EventService] Evento agregado: ${event} (ID: ${eventId})`);
    console.log(`🎯 [EventService] Datos del evento:`, JSON.stringify(data, null, 2));
    console.log(`🎯 [EventService] Cola actual: ${this.eventQueue.length} eventos`);
    
    // 🎯 PROCESAR INMEDIATAMENTE SI NO ESTÁ PROCESANDO
    if (!this.isProcessing) {
      console.log('🚀 [EventService] Iniciando procesamiento inmediato...');
      setImmediate(() => this.startProcessing());
    }
    
    return eventId;
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('🚀 [EventService] Iniciando procesamiento de eventos...');
    console.log(`🚀 [EventService] Eventos en cola: ${this.eventQueue.length}`);
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;
        
        console.log(`🔄 [EventService] Procesando evento: ${event.event} (ID: ${event.id})`);
        console.log(`🔄 [EventService] Datos del evento:`, JSON.stringify(event.data, null, 2));
        
        try {
          await this.processEvent(event);
          console.log(`✅ [EventService] Evento procesado exitosamente: ${event.event} (ID: ${event.id})`);
        } catch (error) {
          console.error(`❌ [EventService] Error procesando evento ${event.id}:`, error);
          await this.handleEventFailure(event);
        }
      }
    } finally {
      this.isProcessing = false;
      console.log('🔄 [EventService] Ciclo de procesamiento completado');
      console.log(`🔄 [EventService] Eventos restantes en cola: ${this.eventQueue.length}`);
    }
    
    // 🎯 PROCESAR INMEDIATAMENTE SI HAY EVENTOS NUEVOS
    if (this.eventQueue.length > 0) {
      console.log('🔄 [EventService] Hay eventos pendientes, procesando inmediatamente...');
      setImmediate(() => this.startProcessing());
    }
  }

  private async processEvent(event: EventData): Promise<void> {
    console.log(`🔄 [EventService] Procesando evento: ${event.event} (ID: ${event.id})`);
    
    event.status = 'processing';
    
    switch (event.event) {
      case 'IMMUNOTHERAPY_TREATMENT':
        await this.processImmunotherapyTreatment(event.data);
        break;
      default:
        throw new Error(`Evento no reconocido: ${event.event}`);
    }
    
    event.status = 'completed';
    console.log(`✅ [EventService] Evento procesado exitosamente: ${event.event} (ID: ${event.id})`);
  }

  private async processImmunotherapyTreatment(data: any): Promise<void> {
    // 🎯 SISTEMA DE LOCKS PARA EVITAR DUPLICADOS
    const lockKey = `immunotherapy_${data.pacienteId}_${data.organizacionId || 'default'}`;
    
    if (this.processingLocks.get(lockKey)) {
      console.log('⚠️ [EventService] Expediente ya está siendo procesado para paciente:', data.pacienteId, '- Saltando duplicado');
      return;
    }
    
    // 🎯 ACTIVAR LOCK
    this.processingLocks.set(lockKey, true);
    
    // 🎯 LIMPIAR LOCK DESPUÉS DE TIMEOUT
    setTimeout(() => {
      this.processingLocks.delete(lockKey);
    }, this.lockTimeout);
    
    try {
      console.log('🏥 [EventService] Iniciando procesamiento de tratamiento de inmunoterapia:', {
        pacienteId: data.pacienteId,
        userId: data.userId,
        tipoTratamiento: data.tipoTratamiento,
        subtipo: data.subtipo,
        unidades: data.unidades,
        dosis: data.dosis,
        alergenos: data.alergenos,
        tuvoReaccion: data.tuvoReaccion,
        descripcionReaccion: data.descripcionReaccion
      });

      const { ImmunotherapyService } = await import('./immunotherapyService');
      const immunotherapyService = ImmunotherapyService.getInstance();
      
      // Obtener organización del usuario
      const user = await this.prisma.usuario.findUnique({
        where: { id: data.userId },
        select: { organizacion_id: true }
      });
      
      if (!user?.organizacion_id) {
        throw new Error('Usuario no tiene organización asignada');
      }
      
      // 🎯 SOLO CREAR/ACTUALIZAR EXPEDIENTE SI HAY DATOS REALES DE TRATAMIENTO
      // Verificar si hay datos específicos de tratamiento (unidades, dosis, alergenos)
      console.log('🔍 [EventService] DIAGNÓSTICO DE DATOS RECIBIDOS:', {
        unidades: data.unidades,
        dosis: data.dosis,
        alergenos: data.alergenos,
        alergenosLength: data.alergenos ? data.alergenos.length : 0,
        tipoTratamiento: data.tipoTratamiento,
        subtipo: data.subtipo
      });
      
      const tieneDatosEspecificos = data.unidades > 0 || data.dosis > 0 || (data.alergenos && data.alergenos.length > 0);
      
      console.log('🔍 [EventService] VALIDACIÓN DE DATOS ESPECÍFICOS:', {
        unidadesMayorCero: data.unidades > 0,
        dosisMayorCero: data.dosis > 0,
        alergenosConDatos: data.alergenos && data.alergenos.length > 0,
        tieneDatosEspecificos: tieneDatosEspecificos
      });
      
      if (!tieneDatosEspecificos) {
        console.log('⚠️ [EventService] No hay datos específicos de tratamiento (unidades, dosis, alergenos), saltando creación de expediente');
        return;
      }
      
      console.log('✅ [EventService] Datos específicos de tratamiento confirmados, procediendo con la creación');
      
      // Crear/actualizar expediente solo si hay un tratamiento real
      const record = await immunotherapyService.createOrUpdateRecord({
        pacienteId: data.pacienteId || '',
        organizacionId: user.organizacion_id,
        fechaInicio: new Date(),
        editadoPor: data.userId
      });
      
      console.log('✅ [EventService] Expediente de inmunoterapia creado/actualizado:', record.id);
      
      // 🎯 CREAR LOG ENTRY COMPLETO DEL TRATAMIENTO
      if (record && record.id) {
        await this.createTreatmentLogEntry(record.id, data, user.organizacion_id);
        console.log('✅ [EventService] Log entry del tratamiento creado exitosamente');
      }
      
    } catch (error) {
      console.error('❌ [EventService] Error procesando tratamiento de inmunoterapia:', error);
      throw error;
    } finally {
      // 🎯 LIMPIAR LOCK AL TERMINAR
      this.processingLocks.delete(lockKey);
      console.log('🔓 [EventService] Lock liberado para paciente:', data.pacienteId);
    }
  }

  // 🎯 NUEVO MÉTODO PARA CREAR LOG ENTRIES COMPLETOS
  private async createTreatmentLogEntry(recordId: string, treatmentData: any, organizacionId: string): Promise<void> {
    try {
      console.log('📝 [EventService] Creando log entry para tratamiento:', {
        recordId,
        tipoTratamiento: treatmentData.tipoTratamiento,
        subtipo: treatmentData.subtipo
      });
      
      // 🎯 DIAGNÓSTICO COMPLETO DE LOS DATOS RECIBIDOS
      console.log('🔍 [EventService] DIAGNÓSTICO COMPLETO - Datos recibidos:', {
        tipoTratamiento: treatmentData.tipoTratamiento,
        subtipo: treatmentData.subtipo,
        unidades: treatmentData.unidades,
        dosis: treatmentData.dosis,
        alergenos: treatmentData.alergenos,
        observaciones: treatmentData.observaciones,
        descripcionReaccion: treatmentData.descripcionReaccion,
        tuvoReaccion: treatmentData.tuvoReaccion
      });
      
      // 🎯 DIAGNÓSTICO ESPECÍFICO DE ITEMS Y ALERGENOS
      console.log('🔍 [EventService] DIAGNÓSTICO DE ITEMS Y ALERGENOS:', {
        itemsLength: treatmentData.items?.length || 0,
        items: treatmentData.items,
        alergenosPrincipales: treatmentData.alergenos,
        primerItem: treatmentData.items?.[0],
        primerItemAlergenos: treatmentData.items?.[0]?.alergenos
      });
      
      // 🎯 LOG DETALLADO DE REACCIONES EN EVENT SERVICE
      console.log('🔍 [EventService] DIAGNÓSTICO DE REACCIONES:', {
        tuvoReaccion: treatmentData.tuvoReaccion,
        descripcionReaccion: treatmentData.descripcionReaccion,
        tipoReaccion: typeof treatmentData.descripcionReaccion,
        esUndefined: treatmentData.descripcionReaccion === undefined,
        esNull: treatmentData.descripcionReaccion === null,
        esVacio: treatmentData.descripcionReaccion === '',
        longitud: treatmentData.descripcionReaccion?.length,
        keysCompletas: Object.keys(treatmentData)
      });

      // Determinar el tipo de tratamiento y subtipo
      let tipoTratamiento = 'INMUNOTERAPIA';
      let subtipo = 'TRATAMIENTO_GENERAL';
      let unidades = 0;
      let dosis = 0;
      let alergenos: string[] = [];
      let observaciones = '';
      let frascos: string[] = []; // 🎯 AGREGADO: Variable para almacenar números de frasco

      // 🎯 LÓGICA INTELIGENTE Y ROBUSTA PARA DETERMINAR TIPO DE TRATAMIENTO
      // PRIORIDAD 1: Usar tipoTratamiento del InventoryService (que ya viene específico)
      if (treatmentData.tipoTratamiento && treatmentData.tipoTratamiento !== 'INMUNOTERAPIA') {
        subtipo = treatmentData.tipoTratamiento;
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        
        // 🎯 CAPTURAR REACCIONES SI EXISTEN
        let reaccionInfo = '';
        if (treatmentData.tuvoReaccion && treatmentData.descripcionReaccion) {
          reaccionInfo = ` | Reacción: ${treatmentData.descripcionReaccion}`;
        }
        
        observaciones = `${treatmentData.tipoTratamiento} - ${unidades} unidades, ${dosis} dosis${reaccionInfo}`;
      }
      // 🎯 DIAGNÓSTICO DE SUBTIPO
      console.log('🔍 [eventService] DIAGNÓSTICO DE SUBTIPO:', {
        subtipo: treatmentData.subtipo,
        tipoTratamiento: treatmentData.tipoTratamiento,
        subtipoType: typeof treatmentData.subtipo,
        esGLICERINADO_FRASCO: treatmentData.subtipo === 'GLICERINADO_FRASCO',
        esGLICERINADO_EN_FRASCO: treatmentData.subtipo === 'GLICERINADO_EN_FRASCO',
        condicion1: treatmentData.subtipo === 'GLICERINADO_FRASCO',
        condicion2: treatmentData.subtipo === 'GLICERINADO_EN_FRASCO',
        condicionCompleta: (treatmentData.subtipo === 'GLICERINADO_FRASCO' || treatmentData.subtipo === 'GLICERINADO_EN_FRASCO')
      });

      // PRIORIDAD 2: Lógica específica por tipo (ANTES de la lógica genérica)
      if (treatmentData.subtipo === 'GLICERINADO_UNIDAD' || treatmentData.subtipo === 'GLICERINADO_POR_UNIDAD') {
        subtipo = 'GLICERINADO_UNIDAD';
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        const frascoType = treatmentData.frascoType || 'Madre';
        observaciones = `Glicerinado por Unidad - ${unidades} unidades, ${dosis} dosis, Frasco: ${frascoType}`;
      } else if (treatmentData.subtipo === 'GLICERINADO_FRASCO' || treatmentData.subtipo === 'GLICERINADO_EN_FRASCO') {
        console.log('🎯 [eventService] ¡CONDICIÓN CUMPLIDA! Entrando a GLICERINADO_FRASCO');
        console.log('🔍 [eventService] Recibiendo treatmentData para GLICERINADO_FRASCO:', treatmentData);
        subtipo = 'GLICERINADO_EN_FRASCO';
        unidades = treatmentData.unidades || 0;
        
        // 🎯 EXTRAER NÚMEROS DE FRASCO DEL CAMPO FRASCO
        frascos = []; // Usar la variable del scope superior
        dosis = 1;
        
        // 🚨 DIAGNÓSTICO COMPLETO DE ITEMS
        console.log('🔍 [eventService] DIAGNÓSTICO COMPLETO DE ITEMS:', {
          itemsExists: !!treatmentData.items,
          itemsLength: treatmentData.items?.length || 0,
          items: treatmentData.items,
          primerItem: treatmentData.items?.[0],
          primerItemKeys: treatmentData.items?.[0] ? Object.keys(treatmentData.items[0]) : [],
          primerItemFrasco: treatmentData.items?.[0]?.frasco,
          primerItemFrascoType: typeof treatmentData.items?.[0]?.frasco
        });
        
        if (treatmentData.items && treatmentData.items.length > 0) {
          const frascoField = treatmentData.items[0].frasco;
          console.log('🔍 [eventService] Campo frasco para GLICERINADO_FRASCO:', frascoField);
          console.log('🔍 [eventService] Tipo de frascoField:', typeof frascoField);
          console.log('🔍 [eventService] frascoField includes Frascos:', frascoField?.includes('Frascos:'));
          
          if (frascoField && frascoField.includes('Frascos:')) {
            // Extraer números de frasco del formato "Frascos: 1, 2"
            const frascoNumbers = frascoField.replace('Frascos:', '').trim().split(',').map((f: string) => f.trim());
            frascos = frascoNumbers;
            console.log('🔍 [eventService] Frascos extraídos:', frascos);
            // 🎯 LAS DOSIS VIENEN DEL CAMPO DOSIS, NO DEL NÚMERO DE FRASCOS
            dosis = treatmentData.dosis || 1;
            console.log('🔍 [eventService] Dosis del formulario:', dosis);
          } else if (frascoField) {
            // Si es un solo número
            const match = frascoField.match(/\d+/);
            if (match) {
              frascos = [match[0]];
              dosis = treatmentData.dosis || 1;
              console.log('🔍 [eventService] Frasco único extraído:', frascos);
            }
          } else {
            console.log('🔍 [eventService] ❌ frascoField es null/undefined/vacío');
          }
        } else {
          console.log('🔍 [eventService] ❌ No hay items o items está vacío');
        }
        
        alergenos = treatmentData.alergenos || [];
        observaciones = `Glicerinado en Frasco - Frascos: ${frascos.join(', ')}, ${dosis} dosis`;
      } else if (treatmentData.subtipo === 'SUBLINGUAL') {
        console.log('🔍 [eventService] Recibiendo treatmentData para SUBLINGUAL:', treatmentData); // <-- NUEVO LOG
        subtipo = 'SUBLINGUAL';
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        
        // 🎯 EXTRAER NÚMERO DE FRASCO DEL PRODUCTID
        let frascoNum = '1'; // Por defecto
        if (treatmentData.items && treatmentData.items.length > 0) {
          const productId = treatmentData.items[0].productId;
          const frascoMatch = productId.match(/#(\d+)/);
          if (frascoMatch) {
            frascoNum = frascoMatch[1];
          }
        }
        
        observaciones = `Sublingual - Frasco ${frascoNum}, ${dosis} dosis`;
      } else if (treatmentData.subtipo && treatmentData.subtipo.startsWith('ALXOID_')) {
        subtipo = treatmentData.subtipo; // 🎯 CORREGIDO: Mantener el subtipo específico (ALXOID_A, ALXOID_B, ALXOID_B.2)
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        observaciones = `${treatmentData.subtipo} - ${unidades} unidades, ${dosis} dosis`;
      }
      // PRIORIDAD 3: Usar subtipo genérico si existe
      else if (treatmentData.subtipo && treatmentData.subtipo !== 'TRATAMIENTO_GENERAL') {
        subtipo = treatmentData.subtipo;
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        observaciones = `${treatmentData.subtipo} - ${unidades} unidades, ${dosis} dosis`;
      } else {
        // 🎯 TRATAMIENTO GENÉRICO CON TODOS LOS DATOS DISPONIBLES
        subtipo = treatmentData.tipoTratamiento || treatmentData.subtipo || 'TRATAMIENTO_GENERAL';
        unidades = treatmentData.unidades || 0;
        dosis = treatmentData.dosis || 1;
        alergenos = treatmentData.alergenos || [];
        observaciones = treatmentData.observaciones || `Tratamiento de inmunoterapia - ${unidades} unidades, ${dosis} dosis`;
      }

      // 🎯 LOG DEL TIPO DE TRATAMIENTO DETERMINADO
      console.log('🎯 [EventService] Tipo de tratamiento determinado:', {
        tipoTratamiento,
        unidades,
        dosis,
        alergenos: alergenos.length,
        observaciones
      });

      // 🎯 CAPTURAR REACCIONES COMPLETAS
      let descripcionReaccion = '';
      if (treatmentData.tuvoReaccion && treatmentData.descripcionReaccion) {
        descripcionReaccion = treatmentData.descripcionReaccion;
      }
      
      // 🎯 EXTRAER NÚMERO DE FRASCO PARA SUBLINGUAL (GLICERINADO_EN_FRASCO ya se procesó arriba)
      if (subtipo === 'SUBLINGUAL') {
        if (treatmentData.items && treatmentData.items.length > 0) {
          const productId = treatmentData.items[0].productId;
          const frascoMatch = productId.match(/#(\d+)/);
          if (frascoMatch) {
            frascos = [frascoMatch[1]];
          } else {
            frascos = ['1']; // Por defecto
          }
        } else {
          frascos = ['1']; // Por defecto
        }
      }
      // NOTA: GLICERINADO_EN_FRASCO ya se procesó en la lógica específica arriba

      // 🎯 CREAR LOG ENTRY COMPLETO Y DETALLADO EN LA BASE DE DATOS
      const logEntryData: any = {
        recordId: recordId,
        fechaAplicacion: new Date(), // ✅ CORREGIDO: Usar fechaAplicacion (campo correcto del esquema)
        tipoTratamiento: tipoTratamiento as any, // ✅ CORREGIDO: Cast para evitar error de tipo
        subtipo: subtipo, // 🎯 AGREGADO: Incluir subtipo
        productId: treatmentData.items?.[0]?.productId || null, // 🎯 AGREGADO: Incluir productId para trazabilidad
        dosis: dosis.toString(), // ✅ CORREGIDO: Convertir a String (esquema espera String)
        unidades: parseInt(unidades.toString()) || 0, // ✅ CORREGIDO: Convertir a Int (esquema espera Int)
        frascos: frascos, // 🎯 AGREGADO: Incluir frascos
        alergenos: alergenos, // ✅ CORREGIDO: Campo correcto del esquema
        descripcionReaccion: descripcionReaccion, // ✅ CORREGIDO: Campo correcto del esquema
        reaccion: treatmentData.tuvoReaccion || false, // ✅ CORREGIDO: Usar 'reaccion' (campo correcto del esquema)
        observaciones: observaciones || 'Tratamiento de inmunoterapia aplicado', // ✅ CORREGIDO: Campo correcto del esquema
        userId: treatmentData.userId // ✅ CORREGIDO: Campo correcto del esquema
      };

      // 🎯 LOG ESPECÍFICO PARA DIAGNOSTICAR FRASCOS
      console.log('🔍 [EventService] DIAGNÓSTICO DE FRASCOS ANTES DE GUARDAR:', {
        subtipo,
        frascos,
        frascosLength: frascos.length,
        frascosType: typeof frascos,
        productId: treatmentData.items?.[0]?.productId
      });

      // 🎯 AGREGAR INFORMACIÓN ADICIONAL PARA TRAZABILIDAD COMPLETA
      if (treatmentData.inventoryUsageId) {
        logEntryData.inventoryUsageId = treatmentData.inventoryUsageId;
      }

      // Obtener información adicional del InventoryUsage si está disponible
      if (treatmentData.inventoryUsageId) {
        try {
          const inventoryUsage = await this.prisma.inventoryUsage.findUnique({
            where: { id: treatmentData.inventoryUsageId },
            select: {
              consultorioId: true,
              sedeId: true,
              observaciones: true
            }
          });

          if (inventoryUsage) {
            // Enriquecer las observaciones con información del consultorio y sede
            if (inventoryUsage.observaciones) {
              logEntryData.observaciones += ` | ${inventoryUsage.observaciones}`;
            }
          }
        } catch (error) {
          console.warn('⚠️ [EventService] No se pudo obtener información adicional del InventoryUsage:', error);
        }
      }

      // ✅ CORREGIDO: Usar los campos correctos del esquema real de la base de datos
      const logEntryToCreate: any = {
        recordId: logEntryData.recordId,
        fechaAplicacion: new Date(),
        tipoTratamiento: 'INMUNOTERAPIA',
        subtipo: subtipo, // 🆕 AGREGAR SUBTIPO
        productId: logEntryData.productId, // 🎯 AGREGADO: Incluir productId
        dosis: (parseFloat(logEntryData.dosis) || 1).toString(), // ✅ CORREGIDO: Convertir a String
        unidades: parseInt(unidades.toString()) || 0, // ✅ CORREGIDO: Convertir a Int
        frascos: frascos, // 🎯 AGREGADO: Incluir frascos
        alergenos: logEntryData.alergenos,
        descripcionReaccion: logEntryData.descripcionReaccion,
        reaccion: logEntryData.reaccion, // ✅ CORREGIDO: Usar 'reaccion' (campo correcto del esquema)
        observaciones: logEntryData.observaciones, // ✅ CORREGIDO: Usar 'observaciones' directamente
        userId: logEntryData.userId
      };

      await this.prisma.immunotherapyLog.create({
        data: logEntryToCreate
      });

      console.log('✅ [EventService] Log entry creado exitosamente con datos:', {
        subtipo,
        unidades,
        dosis,
        alergenos: alergenos.length,
        observaciones,
        descripcionReaccion: logEntryData.descripcionReaccion,
        reaccion: treatmentData.tuvoReaccion || false
      });
      
      // 🎯 LOG COMPLETO DE LO QUE SE GUARDÓ EN LA BASE DE DATOS
      console.log('🎯 [EventService] DATOS COMPLETOS GUARDADOS EN BD:', JSON.stringify(logEntryData, null, 2));

    } catch (error) {
      console.error('❌ [EventService] Error creando log entry del tratamiento:', error);
      // NO lanzar error aquí para no fallar todo el proceso
      // Solo loggear el error para debugging
    }
  }

  private async handleEventFailure(event: EventData): Promise<void> {
    event.retryCount++;
    
    if (event.retryCount >= event.maxRetries) {
      event.status = 'failed';
      event.error = 'Máximo de reintentos alcanzado';
      console.error(`💀 [EventService] Evento falló permanentemente: ${event.event} (ID: ${event.id})`);
    } else {
      event.status = 'pending';
      // Reintentar después del delay
      setTimeout(() => {
        this.eventQueue.unshift(event);
      }, this.retryDelay * event.retryCount);
      
      console.log(`🔄 [EventService] Reintentando evento: ${event.event} (ID: ${event.id}) - Intento ${event.retryCount}`);
    }
  }

  public getQueueStatus(): any {
    return {
      totalEvents: this.eventQueue.length,
      isProcessing: this.isProcessing,
      pendingEvents: this.eventQueue.filter(e => e.status === 'pending').length,
      completedEvents: this.eventQueue.filter(e => e.status === 'completed').length,
      failedEvents: this.eventQueue.filter(e => e.status === 'failed').length
    };
  }
}
