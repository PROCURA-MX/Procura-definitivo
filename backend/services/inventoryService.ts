import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../prisma';
import { EventService } from './eventService';
// import { registrarHistorialInventario } from '../utils/historialUtils';
import { 
  isTreatment, 
  validateTreatmentStock, 
  consumeTreatmentComponents 
} from '../utils/treatmentUtils';
import { RobustProductService, findProductForTreatment } from '../robust-product-service';

// 🎯 FUNCIÓN PARA OBTENER VALOR DINÁMICO DE ENTRADA MÁS RECIENTE
async function getLatestEntryUnitCost(
  tx: any,
  productId: string,
  sedeId: string
): Promise<Decimal> {
  try {
    // Buscar la entrada más reciente para este producto en esta sede
    const latestEntry = await tx.movement.findFirst({
      where: {
        productId: productId,
        sedeId: sedeId,
        type: 'ENTRY'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        unitCost: true,
        createdAt: true
      }
    });

    if (latestEntry) {
      console.log(`✅ Valor dinámico encontrado: ${latestEntry.unitCost} (fecha: ${latestEntry.createdAt})`);
      return latestEntry.unitCost;
    } else {
      // Si no hay entradas, usar el valor por defecto del producto
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { costPerUnit: true, name: true }
      });
      
      if (product) {
        console.log(`⚠️ No hay entradas para ${product.name}, usando valor por defecto: ${product.costPerUnit}`);
        return product.costPerUnit;
      } else {
        throw new Error(`Producto ${productId} no encontrado`);
      }
    }
  } catch (error) {
    console.error(`❌ Error obteniendo valor dinámico para producto ${productId}:`, error);
    throw error;
  }
}

// 🎯 FUNCIÓN ROBUSTA DE MAPEO DE PRODUCTOS
// Implementa arquitectura multi-tenant correcta y escalable
async function getAlergenIdByName(
  tx: any, 
  alergenoNombre: string, 
  organizationId: string,
  sedeId?: string
): Promise<string> {
  try {
    const result = await findProductForTreatment(
      tx,
      alergenoNombre,
      organizationId,
      sedeId || ''
    );
    
    console.log(`✅ Producto encontrado: ${alergenoNombre} -> ID: ${result.productId} (stock: ${result.availableStock})`);
    return result.productId;
    
  } catch (error) {
    console.error(`❌ Error buscando producto "${alergenoNombre}":`, error.message);
    throw error;
  }
}

// 🎯 FUNCIÓN DE MAPEO PARA DILUYENTES
async function getDiluyenteIdByName(tx: any, diluyenteNombre: string): Promise<string> {
  const product = await tx.product.findFirst({
    where: {
      name: {
        equals: diluyenteNombre.trim(),
        mode: 'insensitive'
      }
    },
    select: { id: true, name: true }
  });
  
  if (product) {
    console.log(`✅ Diluyente encontrado: ${diluyenteNombre} -> ID: ${product.id}`);
    return product.id;
  }
  
  throw new Error(`Diluyente no encontrado: "${diluyenteNombre}". Verifique que esté registrado en la base de datos.`);
}

// Tipos adaptados para Express
interface UsageFormItemDto {
  productId: string;
  allergenId?: string;
  allergenIds?: string[];
  quantity?: number;
  cantidad?: number; // Campo del frontend
  units?: number;
  frascoLevel?: number;
  frascoFactor?: number;
  doses?: number;
  frascoLevels?: number[];
  frascoType?: string;
  frasco?: string;
  alergenos?: string[];
  subtipo?: string; // Para tratamientos como Alxoid
  medicamentoReaccionTipo?: string; // Tipo de medicamento para reacción
  medicamentoReaccionDosis?: string; // Dosis del medicamento para reacción
}

interface ProcessUsageDto {
  sedeId: string;
  consultorioId?: string;
  userId: string;
  pacienteId?: string;
  nombrePaciente: string;
  tipoTratamiento: string;
  observaciones?: string;
  tuvoReaccion: boolean;
  descripcionReaccion?: string;
  items: UsageFormItemDto[];
}

export async function processInventoryUsage(dto: ProcessUsageDto) {
  // 🎯 LOG CRÍTICO AL INICIO - DIAGNÓSTICO COMPLETO DEL DTO
  console.log('🎯 [InventoryService] DTO COMPLETO RECIBIDO DEL FRONTEND:', JSON.stringify(dto, null, 2));
  console.log('🎯 [InventoryService] DIAGNÓSTICO ESPECÍFICO DE REACCIONES:');
  console.log('  - dto.tuvoReaccion:', dto.tuvoReaccion);
  console.log('  - dto.descripcionReaccion:', dto.descripcionReaccion);
  console.log('  - tipo de dto.descripcionReaccion:', typeof dto.descripcionReaccion);
  console.log('  - dto.descripcionReaccion === undefined:', dto.descripcionReaccion === undefined);
  console.log('  - dto.descripcionReaccion === null:', dto.descripcionReaccion === null);
  console.log('  - dto.descripcionReaccion === "":', dto.descripcionReaccion === '');
  console.log('  - longitud dto.descripcionReaccion:', dto.descripcionReaccion?.length);
  
  console.log('🚀 Starting processInventoryUsage with items:', dto.items.length);
  
  // Crear instancia del EventService para integración con expedientes
  const eventService = EventService.getInstance();
  
  return prisma.$transaction(async (tx) => {
    // 1. Crear el registro principal de InventoryUsage
    const inventoryUsage = await tx.inventoryUsage.create({
      data: {
        id: generateId(),
        nombrePaciente: dto.nombrePaciente,
        tipoTratamiento: dto.tipoTratamiento as any,
        observaciones: dto.observaciones,
        tuvoReaccion: dto.tuvoReaccion,
        descripcionReaccion: dto.descripcionReaccion,
        sedeId: dto.sedeId,
        consultorioId: dto.consultorioId || '660e8400-e29b-41d4-a716-446655440000',
        userId: dto.userId,
        pacienteId: dto.pacienteId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });

    console.log('✅ Created InventoryUsage with ID:', inventoryUsage.id);

    // 2. Procesar cada item para crear movimientos y detalles
    for (const item of dto.items) {
      console.log('🔄 Processing item:', item);
      
      if (item.allergenIds?.length) {
        await processComplexTreatment(tx, dto, item, inventoryUsage.id);
      } else {
        await processSimpleProduct(tx, dto, item, inventoryUsage.id);
      }
    }

    // 3. 🎯 INTEGRACIÓN CON EXPEDIENTES: Enviar evento para tratamiento de inmunoterapia
    console.log('🔍 [InventoryService] DIAGNÓSTICO COMPLETO - Valores recibidos:');
    console.log('  - tipoTratamiento:', dto.tipoTratamiento);
    console.log('  - pacienteId:', dto.pacienteId);
    console.log('  - nombrePaciente:', dto.nombrePaciente);
    console.log('  - items.length:', dto.items.length);
    console.log('  - items[0]:', JSON.stringify(dto.items[0], null, 2));
    console.log('  - items[0].allergenIds:', dto.items[0]?.allergenIds);
    console.log('  - items[0].units:', dto.items[0]?.units);
    console.log('  - items[0].cantidad:', dto.items[0]?.cantidad);
    console.log('  - items[0].productId:', dto.items[0]?.productId);
    console.log('  - Condición INMUNOTERAPIA:', dto.tipoTratamiento === 'INMUNOTERAPIA');
    console.log('  - Condición pacienteId:', !!dto.pacienteId);
    console.log('  - Condición completa:', dto.tipoTratamiento === 'INMUNOTERAPIA' && dto.pacienteId);
    
    if (dto.tipoTratamiento === 'INMUNOTERAPIA' && dto.pacienteId) {
      console.log('✅ [InventoryService] CONDICIÓN CUMPLIDA - Procediendo con integración');
      try {
        // Extraer nombres de alergenos si existen
        let alergenosNombres: string[] = [];
        
        // 🎯 PRIORIDAD 1: Usar alergenos directos del frontend
        if (dto.items[0]?.alergenos?.length) {
          alergenosNombres = dto.items[0].alergenos;
          console.log('✅ [InventoryService] Alergenos extraídos del frontend:', alergenosNombres);
        }
        // 🎯 PRIORIDAD 2: Buscar por IDs si no hay nombres directos
        else if (dto.items[0]?.allergenIds?.length) {
          console.log('🔍 [InventoryService] Buscando alergenos en BD para IDs:', dto.items[0].allergenIds);
          const alergenos = await tx.product.findMany({
            where: { id: { in: dto.items[0].allergenIds } },
            select: { name: true }
          });
          alergenosNombres = alergenos.map(a => a.name);
          console.log('✅ [InventoryService] Alergenos extraídos de BD:', alergenosNombres);
        } else {
          console.log('⚠️ [InventoryService] No hay alergenos ni allergenIds en el primer item');
        }

        console.log('🔍 [InventoryService] Datos del evento a enviar:', {
          pacienteId: dto.pacienteId,
          inventoryUsageId: inventoryUsage.id,
          alergenos: alergenosNombres,
          tuvoReaccion: dto.tuvoReaccion,
          descripcionReaccion: dto.descripcionReaccion
        });

        // 🎯 DETERMINAR TIPO DE TRATAMIENTO ESPECÍFICO
        let tipoTratamientoEspecifico = 'INMUNOTERAPIA';
        let unidades = 0;
        let dosisTratamiento = 1;
        
        if (dto.items[0]) {
          const item = dto.items[0];
          
          // Determinar unidades
          unidades = item.units || item.cantidad || 0;
          
          // 🎯 PRIORIDAD 1: Usar subtipo del frontend si existe
          if (item.subtipo) {
            tipoTratamientoEspecifico = item.subtipo;
            console.log('✅ [InventoryService] Usando subtipo del frontend:', tipoTratamientoEspecifico);
          }
          // 🎯 PRIORIDAD 2: Determinar basado en el producto
          else if (item.productId) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              console.log('🔍 [InventoryService] Analizando producto:', product.name);
              if (product.name.toLowerCase().includes('glicerinado')) {
                if (item.units && item.units > 0) {
                  tipoTratamientoEspecifico = 'GLICERINADO_UNIDAD';
                } else if (item.frascoLevel !== undefined) {
                  tipoTratamientoEspecifico = 'GLICERINADO_FRASCO';
                }
              } else if (product.name.toLowerCase().includes('alxoid')) {
                tipoTratamientoEspecifico = 'ALXOID';
              } else if (product.name.toLowerCase().includes('sublingual')) {
                tipoTratamientoEspecifico = 'SUBLINGUAL';
              }
            }
          }
        }
        
        console.log('🎯 [InventoryService] Tipo de tratamiento determinado:', tipoTratamientoEspecifico);
        console.log('🎯 [InventoryService] Unidades determinadas:', unidades);
        
        // 🎯 DETERMINAR DOSIS Y MEDICAMENTO DE REACCIÓN
        let dosis = 1;
        let medicamentoReaccion = {};
        
        if (dto.items[0]) {
          const item = dto.items[0];
          // Determinar dosis
          dosis = item.doses || 1;
          
          // Determinar medicamento de reacción
          if (dto.tuvoReaccion && item.medicamentoReaccionTipo) {
            medicamentoReaccion = {
              tipo: item.medicamentoReaccionTipo,
              dosis: item.medicamentoReaccionDosis || 'N/A'
            };
          }
        }
        
        console.log('🎯 [InventoryService] Dosis determinadas:', dosis);
        console.log('🎯 [InventoryService] Medicamento reacción:', medicamentoReaccion);
        
        // 🎯 LOG COMPLETO ANTES DE ENVIAR EL EVENTO
        console.log('🎯 [InventoryService] Evento IMMUNOTHERAPY_TREATMENT a enviar:', {
          pacienteId: dto.pacienteId,
          inventoryUsageId: inventoryUsage.id,
          tipoTratamiento: tipoTratamientoEspecifico,
          subtipo: tipoTratamientoEspecifico,
          unidades: unidades,
          dosis: dosis,
          alergenos: alergenosNombres,
          tuvoReaccion: dto.tuvoReaccion,
          descripcionReaccion: dto.descripcionReaccion
        });
        
        // 🎯 LOG DETALLADO DE REACCIONES
        console.log('🎯 [InventoryService] DIAGNÓSTICO DE REACCIONES:', {
          tuvoReaccion: dto.tuvoReaccion,
          descripcionReaccion: dto.descripcionReaccion,
          tipoReaccion: typeof dto.descripcionReaccion,
          esUndefined: dto.descripcionReaccion === undefined,
          esNull: dto.descripcionReaccion === null,
          esVacio: dto.descripcionReaccion === '',
          longitud: dto.descripcionReaccion?.length
        });
        
        // 🎯 LOG INMEDIATO ANTES DE ENVIAR EL EVENTO
        const eventData = {
          pacienteId: dto.pacienteId,
          inventoryUsageId: inventoryUsage.id,
          tipoTratamiento: tipoTratamientoEspecifico, // Usar el tipo específico
          subtipo: tipoTratamientoEspecifico, // 🎯 AGREGAR SUBTIPO EXPLÍCITAMENTE
          nombrePaciente: dto.nombrePaciente,
          userId: dto.userId,
          sedeId: dto.sedeId,
          consultorioId: dto.consultorioId,
          observaciones: dto.observaciones,
          tuvoReaccion: dto.tuvoReaccion,
          descripcionReaccion: dto.descripcionReaccion,
          alergenos: alergenosNombres,
          unidades: unidades, // Agregar unidades específicas
          dosis: dosis, // Agregar dosis específicas
          medicamentoReaccion: medicamentoReaccion, // Agregar medicamento de reacción
          items: dto.items.map(item => ({
            productId: item.productId,
            allergenIds: item.allergenIds,
            alergenos: item.alergenos, // ✅ AGREGADO: Campo faltante para el EventService
            units: item.units,
            cantidad: item.cantidad,
            frascoLevel: item.frascoLevel,
            frascoType: item.frascoType,
            frasco: item.frasco, // 🎯 AGREGADO: Campo crítico para GLICERINADO_FRASCO
            medicamentoReaccionTipo: item.medicamentoReaccionTipo,
            medicamentoReaccionDosis: item.medicamentoReaccionDosis
          }))
        };
        
        console.log('🎯 [InventoryService] DATOS COMPLETOS DEL EVENTO A ENVIAR:', JSON.stringify(eventData, null, 2));
        
        // Enviar evento para crear/actualizar expediente
        await eventService.addEvent('IMMUNOTHERAPY_TREATMENT', eventData);
        
        console.log('✅ [InventoryService] Evento IMMUNOTHERAPY_TREATMENT enviado exitosamente');
      } catch (error) {
        console.error('❌ [InventoryService] Error al enviar evento de inmunoterapia:', error);
        // NO fallar el proceso principal si falla el evento
      }
    } else {
      console.log('❌ [InventoryService] CONDICIÓN NO CUMPLIDA - No se ejecuta integración');
      console.log('  - tipoTratamiento === INMUNOTERAPIA:', dto.tipoTratamiento === 'INMUNOTERAPIA');
      console.log('  - pacienteId existe:', !!dto.pacienteId);
    }

    return inventoryUsage;
  }, {
    maxWait: 20000, // 20 segundos para esperar la transacción
    timeout: 20000, // 20 segundos para la transacción
  });
}

async function processComplexTreatment(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando tratamiento complejo con alérgenos:', item.allergenIds?.length);

  // Buscar por ID primero, si no existe, buscar por nombre (case-insensitive, trim)
  let product = await tx.product.findUnique({ where: { id: item.productId } });
  if (!product) {
    product = await tx.product.findFirst({
      where: {
        name: { equals: item.productId.trim(), mode: 'insensitive' },
      },
    });
  }
  if (!product) throw new Error(`Product ${item.productId} not found`);

  if (product.name.toLowerCase().includes('glicerinado')) {
    await processGlicerinadoTreatment(tx, dto, item, inventoryUsageId, product);
  } else if (product.name.toLowerCase().includes('alxoid')) {
    await processAlxoidTreatment(tx, dto, item, inventoryUsageId, product);
  } else if (product.name.toLowerCase().includes('sublingual')) {
    await processSublingualTreatment(tx, dto, item, inventoryUsageId);
  } else {
    throw new Error(`Unsupported complex product: ${product.name}`);
  }
}

async function processGlicerinadoTreatment(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string,
  product: any
) {
  console.log('🔄 Procesando tratamiento Glicerinado');

  // 🎯 PRIORIDAD 1: Usar subtipo específico si está disponible
  if (item.subtipo === 'GLICERINADO_FRASCO') {
    console.log('🎯 Detectado GLICERINADO_FRASCO por subtipo, usando función correcta');
    console.log('🔍 [processGlicerinadoTreatment] Item completo antes de llamar processGlicerinadoEnFrasco:', JSON.stringify(item, null, 2));
    await processGlicerinadoEnFrasco(tx, dto, item, inventoryUsageId);
    return;
  } else if (item.subtipo === 'GLICERINADO_UNIDAD') {
    console.log('🎯 Detectado GLICERINADO_UNIDAD por subtipo, usando función correcta');
    await processGlicerinadoPorUnidad(tx, dto, item, inventoryUsageId);
    return;
  }

  // 🎯 PRIORIDAD 2: Lógica legacy por campos (para compatibilidad)
  if (item.units) {
    // Glicerinado por Unidad
    await processGlicerinadoPorUnidad(tx, dto, item, inventoryUsageId);
  } else if (item.frascoLevel !== undefined || item.frascoLevels) {
    // Glicerinado por Frasco
    await processGlicerinadoPorFrasco(tx, dto, item, inventoryUsageId);
  } else {
    throw new Error('Invalid glicerinado parameters');
  }
}

async function processGlicerinadoPorUnidad(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando Glicerinado por Unidad');
  
  // 🎯 CORRECCIÓN: Usar los datos que realmente envía el frontend
  const unidades = item.cantidad || item.quantity || 1;
  const tipoFrasco = item.frasco || 'Madre';
  const alergenos = item.alergenos || [];
  const factorFrascoMadre = 1; // Por defecto
  
  console.log(`📊 Datos del tratamiento:`, {
    unidades,
    tipoFrasco,
    alergenos,
    factorFrascoMadre
  });
  
  // 1. Calcular consumo usando la lógica correcta
  const { calculateGlicerinadoPorUnidad } = await import('../utils/treatmentUtils');
  const calculo = calculateGlicerinadoPorUnidad(unidades, tipoFrasco, alergenos, dto.items[0]?.doses || 1);
  
  console.log(`📊 Cálculo realizado:`, calculo);
  
  // 2. Validar stock para cada alérgeno
  const missingComponents: string[] = [];
  
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      
      const stock = await tx.stockBySede.findFirst({
        where: {
          productId: alergenoId,
          sedeId: dto.sedeId
        }
      });
      
      const availableStock = stock?.quantity || 0;
      if (availableStock < alergeno.mlConsumidos) {
        missingComponents.push(`${alergeno.nombre} (stock: ${availableStock}, necesario: ${alergeno.mlConsumidos})`);
      }
    } catch (error) {
      missingComponents.push(`${alergeno.nombre} (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  // 3. Validar diluyentes si se necesitan
  if (calculo.diluyentes.evans > 0) {
    try {
      const evansId = await getDiluyenteIdByName(tx, 'Evans');
      const evansStock = await tx.stockBySede.findFirst({
        where: {
          productId: evansId,
          sedeId: dto.sedeId
        }
      });
      
      const availableEvans = evansStock?.quantity || 0;
      if (availableEvans < calculo.diluyentes.evans) {
        missingComponents.push(`Evans (stock: ${availableEvans}, necesario: ${calculo.diluyentes.evans})`);
      }
    } catch (error) {
      missingComponents.push(`Evans (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  if (calculo.diluyentes.bacteriana > 0) {
    try {
      const bacterianaId = await getDiluyenteIdByName(tx, 'Bacteriana');
      const bacterianaStock = await tx.stockBySede.findFirst({
        where: {
          productId: bacterianaId,
          sedeId: dto.sedeId
        }
      });
      
      const availableBacteriana = bacterianaStock?.quantity || 0;
      if (availableBacteriana < calculo.diluyentes.bacteriana) {
        missingComponents.push(`Bacteriana (stock: ${availableBacteriana}, necesario: ${calculo.diluyentes.bacteriana})`);
      }
    } catch (error) {
      missingComponents.push(`Bacteriana (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  if (missingComponents.length > 0) {
    throw new Error(`Stock insuficiente para tratamiento Glicerinado por Unidad: ${missingComponents.join(', ')}`);
  }
  
  // 4. 🎯 CREAR MOVIMIENTOS INDIVIDUALES PARA CADA ALÉRGENO
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      const product = await tx.product.findUnique({ where: { id: alergenoId } });
      
      if (product) {
        // ✅ CREAR MOVIMIENTO INDIVIDUAL para cada alérgeno
        await processMovement(tx, dto, product, alergeno.mlConsumidos, inventoryUsageId);
        
        console.log(`✅ Movimiento creado para ${alergeno.nombre}: ${alergeno.mlConsumidos}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando alérgeno ${alergeno.nombre}:`, error);
      throw error;
    }
  }
  
  // 5. 🎯 CREAR MOVIMIENTOS INDIVIDUALES PARA DILUYENTES
  if (calculo.diluyentes.evans > 0) {
    try {
      const evansId = await getDiluyenteIdByName(tx, 'Evans');
      const evansProduct = await tx.product.findUnique({ where: { id: evansId } });
      
      if (evansProduct) {
        // ✅ CREAR MOVIMIENTO INDIVIDUAL para Evans
        await processMovement(tx, dto, evansProduct, calculo.diluyentes.evans, inventoryUsageId);
        
        console.log(`✅ Movimiento creado para Evans: ${calculo.diluyentes.evans}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando diluyente Evans:`, error);
      throw error;
    }
  }
  
  if (calculo.diluyentes.bacteriana > 0) {
    try {
      const bacterianaId = await getDiluyenteIdByName(tx, 'Bacteriana');
      const bacterianaProduct = await tx.product.findUnique({ where: { id: bacterianaId } });
      
      if (bacterianaProduct) {
        // ✅ CREAR MOVIMIENTO INDIVIDUAL para Bacteriana
        await processMovement(tx, dto, bacterianaProduct, calculo.diluyentes.bacteriana, inventoryUsageId);
        
        console.log(`✅ Movimiento creado para Bacteriana: ${calculo.diluyentes.bacteriana}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando diluyente Bacteriana:`, error);
      throw error;
    }
  }
  
  // 6. Registrar historial del tratamiento completo - TEMPORALMENTE DESHABILITADO
  // await registrarHistorialInventario(
  //   'ELIMINACION',
  //   null,
  //   {
  //     tratamiento: 'Glicerinado por Unidad',
  //     unidades: unidades,
  //     tipoFrasco: tipoFrasco,
  //     alergenos: alergenos,
  //     paciente: dto.nombrePaciente,
  //     consultorio: dto.consultorioId,
  //     sede: dto.sedeId,
  //     timestamp: new Date().toISOString()
  //   },
  //   dto.userId,
  //   undefined,
  //   {
  //     producto_nombre: 'Glicerinado por Unidad',
  //     cantidad: unidades,
  //     tipo_movimiento: 'SALIDA',
  //     motivo_cambio: 'Tratamiento de inmunoterapia aplicado'
  //   }
  // );
  
  console.log(`✅ Glicerinado por Unidad procesado exitosamente con movimientos individuales`);
}

async function processGlicerinadoPorFrasco(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando Glicerinado por Frasco');
  const doses = item.doses || 1;
  const frascoLevels: number[] = Array.isArray(item.frascoLevels)
    ? item.frascoLevels
    : item.frascoLevel !== undefined
      ? [item.frascoLevel]
      : [];
  const allergenIds: string[] = item.allergenIds || [];
  if (!frascoLevels.length || !allergenIds.length) {
    throw new Error('Faltan frascos o alérgenos para Glicerinado en Frasco');
  }
  // Factores de conversión por frasco (indexados desde 0)
  const FACTORES_FRASCOS = [0.002, 0.005, 0.02, 0.05, 0.2, 0.5];
  let totalEvans = 0;
  let totalBacteriana = frascoLevels.length * 2 * doses;
  // Procesar movimientos de alérgenos
  for (const frascoLevel of frascoLevels) {
    const factor = FACTORES_FRASCOS[frascoLevel] || 0;
    for (const allergenId of allergenIds) {
      const mlConsumido = Number((factor * doses).toFixed(4));
      console.log(`🔄 Procesando movimiento para alérgeno ${allergenId}, frasco ${frascoLevel + 1}, cantidad: ${mlConsumido}`);
      await processAllergenMovement(tx, dto, allergenId, mlConsumido, inventoryUsageId);
    }
    // Evans por frasco
    const evansMl = Number((3 - (factor * allergenIds.length)) * doses).toFixed(4);
    totalEvans += Number(evansMl);
  }
  // Registrar movimiento de Evans (si corresponde)
  if (totalEvans > 0) {
    console.log(`🔄 Procesando movimiento para diluyente Evans, cantidad: ${totalEvans}`);
    await processDiluentMovement(tx, dto, 'Evans', Number(totalEvans.toFixed(4)), inventoryUsageId);
  }
  // Registrar movimiento de Bacteriana
  if (totalBacteriana > 0) {
    console.log(`🔄 Procesando movimiento para diluyente Bacteriana, cantidad: ${totalBacteriana}`);
    await processDiluentMovement(tx, dto, 'Bacteriana', Number(totalBacteriana.toFixed(4)), inventoryUsageId);
  }
}

async function processAlxoidTreatment(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string,
  product: any
) {
  console.log('🔄 Procesando tratamiento Alxoid');
  
  // Obtener datos del frontend
  const subtipo = item.subtipo || 'A';
  const alergenos = item.alergenos || [];
  const dosis = item.doses || 1; // 🎯 CORREGIDO: Usar doses en lugar de cantidad
  
  console.log('📊 Datos del tratamiento Alxoid:', {
    subtipo,
    alergenos,
    dosis
  });

  // Validar que haya alérgenos seleccionados
  if (alergenos.length === 0) {
    throw new Error('Debe seleccionar al menos un alérgeno para el tratamiento Alxoid');
  }

  // Extraer el tipo real del subtipo (A, B, o B.2)
  let tipoReal: 'A' | 'B' | 'B.2';
  if (subtipo === 'ALXOID_A') tipoReal = 'A';
  else if (subtipo === 'ALXOID_B') tipoReal = 'B';
  else if (subtipo === 'ALXOID_B_2' || subtipo === 'ALXOID_B.2') tipoReal = 'B.2'; // 🎯 CORREGIDO: Reconocer ambos formatos
  else tipoReal = 'A'; // Default

  console.log('🎯 Subtipo mapeado:', { subtipo, tipoReal });

  // Calcular componentes del tratamiento
  const { calculateAlxoidTreatment } = await import('../utils/treatmentUtils');
  const calculo = calculateAlxoidTreatment(dosis, tipoReal, alergenos);
  console.log('🧮 Cálculo del tratamiento Alxoid:', calculo);

  // Validar stock de alérgenos
  const missingComponents: string[] = [];
  
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      
      const stock = await tx.stockBySede.findFirst({
        where: {
          productId: alergenoId,
          sedeId: dto.sedeId
        }
      });
      
      const availableStock = stock?.quantity || 0;
      if (availableStock < alergeno.mlConsumidos) {
        missingComponents.push(`${alergeno.nombre} (stock: ${availableStock}, necesario: ${alergeno.mlConsumidos})`);
      }
    } catch (error) {
      missingComponents.push(`${alergeno.nombre} (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  if (missingComponents.length > 0) {
    throw new Error(`Stock insuficiente para tratamiento Alxoid: ${missingComponents.join(', ')}`);
  }

  // ✅ CONSUMIR ALÉRGENOS
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      const product = await tx.product.findUnique({ where: { id: alergenoId } });
      
      if (product) {
        // ✅ CREAR MOVIMIENTO INDIVIDUAL para cada alérgeno
        await processMovement(tx, dto, product, alergeno.mlConsumidos, inventoryUsageId);
        
        console.log(`✅ Movimiento creado para ${alergeno.nombre}: ${alergeno.mlConsumidos}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando alérgeno ${alergeno.nombre}:`, error);
      throw error;
    }
  }

  // ✅ CONSUMIR DILUYENTES (Evans y Bacteriana)
  if (calculo.diluyentes.evans > 0) {
    try {
      const evansId = await getAlergenIdByName(tx, 'Evans', dto.organizationId, dto.sedeId);
      const evansProduct = await tx.product.findUnique({ where: { id: evansId } });
      
      if (evansProduct) {
        await processMovement(tx, dto, evansProduct, calculo.diluyentes.evans, inventoryUsageId);
        console.log(`✅ Movimiento creado para Evans: ${calculo.diluyentes.evans}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando Evans:`, error);
      throw error;
    }
  }

  if (calculo.diluyentes.bacteriana > 0) {
    try {
      const bacterianaId = await getAlergenIdByName(tx, 'Bacteriana', dto.organizationId, dto.sedeId);
      const bacterianaProduct = await tx.product.findUnique({ where: { id: bacterianaId } });
      
      if (bacterianaProduct) {
        await processMovement(tx, dto, bacterianaProduct, calculo.diluyentes.bacteriana, inventoryUsageId);
        console.log(`✅ Movimiento creado para Bacteriana: ${calculo.diluyentes.bacteriana}ml`);
      }
    } catch (error) {
      console.error(`❌ Error procesando Bacteriana:`, error);
      throw error;
    }
  }

  // Registrar historial del tratamiento completo - TEMPORALMENTE DESHABILITADO
  // await registrarHistorialInventario(
  //   'ELIMINACION',
  //   null,
  //   {
  //     tratamiento: 'Alxoid',
  //     subtipo: tipoReal,
  //     dosis: dosis,
  //     alergenos: alergenos,
  //     paciente: dto.nombrePaciente,
  //     consultorio: dto.consultorioId,
  //     sede: dto.sedeId,
  //     timestamp: new Date().toISOString()
  //   },
  //   dto.userId,
  //   undefined,
  //   {
  //     producto_nombre: `Alxoid ${tipoReal}`,
  //     cantidad: dosis,
  //     tipo_movimiento: 'SALIDA',
  //     motivo_cambio: `Tratamiento Alxoid ${tipoReal} aplicado - ${dosis} dosis`
  //   }
  // );
  
  console.log(`✅ Alxoid ${tipoReal} procesado exitosamente con movimientos individuales`);
}


function normalizeString(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/\s+/g, '') // Elimina espacios
    .toLowerCase();
}

async function processAllergenMovement(
  tx: any,
  dto: ProcessUsageDto,
  allergenIdOrName: string,
  quantity: number,
  inventoryUsageId: string
) {
  console.log(`🔄 Procesando movimiento para alérgeno ${allergenIdOrName}, cantidad: ${quantity}`);

  // Buscar directamente en la tabla Product con categoría "Alérgenos"
  let product = await tx.product.findFirst({
    where: {
      AND: [
        { category: 'Alérgenos' },
        {
          OR: [
            { id: allergenIdOrName },
            { name: { equals: allergenIdOrName.trim(), mode: 'insensitive' } }
          ]
        }
      ]
    }
  });

  if (!product) {
    // Buscar por nombre normalizado (ignorando tildes y espacios)
    const allAllergens = await tx.product.findMany({
      where: { category: 'Alérgenos' }
    });
    const normalizedInput = normalizeString(allergenIdOrName);
    const allergen = allAllergens.find((a: { name: string }) => normalizeString(a.name) === normalizedInput);
    
    if (allergen) {
      product = allergen;
    }
  }

  if (!product) {
    throw new Error(`Allergen ${allergenIdOrName} not found in Product table with category 'Alérgenos'`);
  }

  await processMovement(tx, dto, product, quantity, inventoryUsageId);
}

async function processDiluentMovement(
  tx: any,
  dto: ProcessUsageDto,
  diluentName: string,
  quantity: number,
  inventoryUsageId: string
) {
  console.log(`🔄 Procesando movimiento para diluyente ${diluentName}, cantidad: ${quantity}`);

  try {
    // 🎯 USAR LA FUNCIÓN DE MAPEO ROBUSTA
    const diluyenteId = await getDiluyenteIdByName(tx, diluentName);
    
    // Buscar el producto diluyente por ID
    const product = await tx.product.findUnique({ 
      where: { id: diluyenteId },
      include: { ProductAllergen: { include: { Allergen: true } } }
    });

    if (!product) {
      throw new Error(`Diluent product ${diluentName} not found`);
    }

    await processMovement(tx, dto, product, quantity, inventoryUsageId);
  } catch (error) {
    console.error(`❌ Error procesando diluyente ${diluentName}:`, error);
    throw error;
  }
}

async function processSimpleProduct(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando producto simple');
  console.log('🔍 DEBUG - Item recibido en processSimpleProduct:', JSON.stringify(item, null, 2));

  // 🎯 NUEVA LÓGICA: Verificar si es un tratamiento por subtipo PRIMERO
  if (item.subtipo === 'SUBLINGUAL') {
    console.log(`🎯 Detectado tratamiento SUBLINGUAL por subtipo`);
    await processSublingualTreatment(tx, dto, item, inventoryUsageId);
    return;
  }
  
  if (item.subtipo === 'GLICERINADO_FRASCO') {
    console.log(`🎯 Detectado tratamiento GLICERINADO_FRASCO por subtipo`);
    await processGlicerinadoEnFrasco(tx, dto, item, inventoryUsageId);
    return;
  }
  
  if (item.subtipo === 'GLICERINADO_UNIDAD') {
    console.log(`🎯 Detectado tratamiento GLICERINADO_UNIDAD por subtipo`);
    await processGlicerinadoPorUnidad(tx, dto, item, inventoryUsageId);
    return;
  }
  
  if (item.subtipo && item.subtipo.startsWith('ALXOID_')) {
    console.log(`🎯 Detectado tratamiento ALXOID por subtipo: ${item.subtipo}`);
    // ✅ ALXOID NO ES UN PRODUCTO - es un tratamiento que usa alérgenos individuales
    // NO buscar producto, procesar directamente el tratamiento
    await processAlxoidTreatment(tx, dto, item, inventoryUsageId, null);
    return;
  }

  // 🎯 BUSCAR PRODUCTO SOLO SI NO ES UN TRATAMIENTO
  let product = await tx.product.findUnique({ where: { id: item.productId } });
  if (!product) {
    product = await tx.product.findFirst({
      where: {
        name: { equals: item.productId.trim(), mode: 'insensitive' },
      },
    });
  }
  if (!product) {
    throw new Error(`Product ${item.productId} not found`);
  }

  // 🎯 LÓGICA LEGACY: Verificar si es un tratamiento por nombre de producto
  if (isTreatment(product.name)) {
    console.log(`🎯 Detectado tratamiento: ${product.name}`);
    await processTreatmentProduct(tx, dto, item, inventoryUsageId, product);
    return;
  }

  // Verificar si el producto tiene stock disponible en la sede
  const stock = await tx.stockBySede.findUnique({
    where: {
      productId_sedeId: {
        productId: product.id,
        sedeId: dto.sedeId
      }
    }
  });

  // Si no hay stock para este producto, buscar otros productos con el mismo nombre
  const requestedQuantity = item.cantidad || item.quantity || 1;
  if (!stock || stock.quantity < requestedQuantity) {
    console.log(`⚠️ Producto ${product.name} (${product.id}) no tiene stock suficiente. Buscando alternativas...`);
    
    // Buscar productos con el mismo nombre que tengan stock en esta sede
    const alternativeProducts = await tx.product.findMany({
      where: {
        name: { equals: item.productId.trim(), mode: 'insensitive' },
        id: { not: product.id } // Excluir el producto actual
      },
      include: {
        StockBySede: {
          where: {
            sedeId: dto.sedeId,
            quantity: { gte: requestedQuantity }
          }
        }
      }
    });

    // Filtrar solo productos que tengan stock suficiente
    const productsWithStock = alternativeProducts.filter((p: any) => p.StockBySede.length > 0);
    
    if (productsWithStock.length > 0) {
      const altProduct = productsWithStock[0];
      const altStock = altProduct.StockBySede[0];
      console.log(`✅ Encontrado producto alternativo con stock: ${altProduct.name} (${altProduct.id}) - Stock: ${altStock.quantity}`);
      product = altProduct;
    } else {
      console.log(`❌ No se encontraron productos alternativos con stock suficiente para ${item.productId}`);
    }
  }

  // Usar cantidad del frontend o quantity como fallback
  const quantity = new Decimal(item.cantidad || item.quantity || 1);
  
  // Logging para debug
  console.log('🔧 Procesando cantidad:', {
    itemCantidad: item.cantidad,
    itemQuantity: item.quantity,
    finalQuantity: quantity.toString(),
    productName: product.name
  });
  await processMovement(tx, dto, product, quantity, inventoryUsageId);
}

async function processTreatmentProduct(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string,
  product: any
) {
  console.log(`🎯 Procesando tratamiento: ${product.name}`);
  
  if (product.name === 'Glicerinado por Unidad') {
    await processGlicerinadoPorUnidad(tx, dto, item, inventoryUsageId);
  } else if (product.name.includes('Alxoid')) {
    await processAlxoidTreatment(tx, dto, item, inventoryUsageId, product);
  } else if (item.subtipo === 'SUBLINGUAL') {
    await processSublingualTreatment(tx, dto, item, inventoryUsageId);
  } else if (item.subtipo === 'GLICERINADO_FRASCO') {
    await processGlicerinadoEnFrasco(tx, dto, item, inventoryUsageId);
  } else {
    // Para otros tratamientos (se implementarán después)
    console.log(`⚠️ Tratamiento ${product.name} no implementado aún`);
  }
}

async function processMovement(
  tx: any,
  dto: ProcessUsageDto,
  product: any,
  quantity: number | Decimal,
  inventoryUsageId: string
) {
  console.log(`🔄 Processing movement for product: ${product.name}, quantity: ${quantity}`);
  
  const quantityDecimal = typeof quantity === 'number' ? new Decimal(quantity) : quantity;
  
  await validateStock(dto.sedeId, product.id, quantityDecimal);
  const stock = await getStockWithExpiry(dto.sedeId, product.id);
  
  // 🎯 VALOR DINÁMICO: Obtener el valor unitario de la entrada más reciente
  const unitCost = await getLatestEntryUnitCost(tx, product.id, dto.sedeId);
  const totalCost = unitCost.mul(quantityDecimal);
  
  // Logging para debug
  console.log('🔧 Valores del movimiento:', {
    productName: product.name,
    productId: product.id,
    quantity: quantityDecimal.toString(),
    unitCost: unitCost.toString(),
    totalCost: totalCost.toString(),
    consultorioId: dto.consultorioId,
    sedeId: dto.sedeId
  });

  // Crear Movement con valores correctos
  const movement = await tx.movement.create({
    data: {
      id: generateId(),
      userId: dto.userId,
      sedeId: dto.sedeId,
      consultorioId: dto.consultorioId,
      productId: product.id,
      type: 'EXIT',
      quantity: quantityDecimal,
      unitCost: unitCost,
      totalCost: totalCost,
      batchNumber: stock?.batchNumber,
      expiryDate: stock?.expiryDate,
      createdAt: new Date()
    },
  });

  console.log('✅ Created Movement with ID:', movement.id);

  // Registrar en historial - TEMPORALMENTE DESHABILITADO
  // await registrarHistorialInventario(
  //   'CREACION',
  //   null,
  //   movement,
  //   dto.userId,
  //   movement.id,
  //   {
  //     producto_id: product.id,
  //     producto_nombre: product.name,
  //     cantidad: quantityDecimal.toNumber(),
  //     tipo_movimiento: 'SALIDA',
  //     motivo_cambio: `Salida de inventario - Paciente: ${dto.nombrePaciente}, Tratamiento: ${dto.tipoTratamiento}`
  //   }
  // );

  // Crear InventoryUsageDetail
  const detail = await tx.inventoryUsageDetail.create({
    data: {
      id: generateId(),
      inventoryUsageId: inventoryUsageId,
      movementId: movement.id,
      productId: product.id,
      quantity: quantityDecimal.toNumber(),
      unitCost: unitCost.toNumber(),
      totalCost: totalCost.toNumber(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
  });

  console.log('✅ Created InventoryUsageDetail with ID:', detail.id);

  // Actualizar StockBySede
  await tx.stockBySede.update({
    where: { productId_sedeId: { productId: product.id, sedeId: dto.sedeId } },
    data: { quantity: { decrement: quantityDecimal.toNumber() } },
  });

  // Actualizar ProductExpiration
  if (stock) {
    await tx.productExpiration.update({
      where: { id: stock.id },
      data: { quantity: { decrement: quantityDecimal.toNumber() } },
    });
  }

  // 🚀 INVALIDACIÓN INMEDIATA DE CACHÉ - NIVEL GOOGLE
  // Invalidar caché del dashboard inmediatamente después de cada movimiento
  try {
    const { invalidateCacheByPrefix } = require('../utils/cache');
    invalidateCacheByPrefix('dashboard');
    console.log('🚀 Caché del dashboard invalidado inmediatamente');
  } catch (error) {
    console.error('❌ Error invalidando caché:', error);
  }
}

async function validateStock(sedeId: string, productId: string, quantity: Decimal): Promise<void> {
  const stock = await prisma.stockBySede.findUnique({
    where: {
      productId_sedeId: {
        productId,
        sedeId,
      },
    },
  });

  if (!stock || Number(stock.quantity) < quantity.toNumber()) {
    throw new Error(`Insufficient stock for product ${productId}`);
  }
}

async function getStockWithExpiry(
  sedeId: string, 
  productId: string
): Promise<any> {
  return prisma.productExpiration.findFirst({
    where: {
      productId,
      sedeId,
      quantity: { gt: 0 },
    },
    orderBy: {
      expiryDate: 'asc',
    },
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 🎯 PROCESAR TRATAMIENTO SUBLINGUAL
async function processSublingualTreatment(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando tratamiento Sublingual');
  
  // Obtener datos del frontend
  const frascos = item.frasco ? [parseInt(item.frasco)] : [1]; // Convertir string a array de números
  const alergenos = item.alergenos || [];
  
  console.log('📊 Datos del tratamiento Sublingual:', {
    frascos,
    alergenos
  });

  // Validar que haya alérgenos seleccionados
  if (alergenos.length === 0) {
    throw new Error('Debe seleccionar al menos un alérgeno para el tratamiento Sublingual');
  }

  // Calcular componentes del tratamiento
  const { calculateSublingualTreatment } = await import('../utils/treatmentUtils');
  const calculo = calculateSublingualTreatment(frascos, alergenos);
  console.log('🧮 Cálculo del tratamiento Sublingual:', calculo);
  
  // 🎯 DEBUG: Mostrar valores exactos de cada alérgeno
  console.log('🔍 DEBUG - Valores exactos por alérgeno:');
  calculo.alergenos.forEach((alergeno, index) => {
    console.log(`  ${index + 1}. ${alergeno.nombre}: ${alergeno.mlConsumidos} ml (tipo: ${typeof alergeno.mlConsumidos})`);
  });

  // Validar stock de alérgenos
  const missingComponents: string[] = [];
  
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      
      const stock = await tx.stockBySede.findFirst({
        where: {
          productId: alergenoId,
          sedeId: dto.sedeId
        }
      });
      
      const availableStock = stock?.quantity || 0;
      if (availableStock < alergeno.mlConsumidos) {
        missingComponents.push(`${alergeno.nombre} (stock: ${availableStock}, necesario: ${alergeno.mlConsumidos})`);
      }
    } catch (error) {
      missingComponents.push(`${alergeno.nombre} (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  if (missingComponents.length > 0) {
    throw new Error(`Stock insuficiente para tratamiento Sublingual: ${missingComponents.join(', ')}`);
  }

  // Consumir alérgenos
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      const product = await tx.product.findUnique({ where: { id: alergenoId } });
      
      if (product) {
        await processMovement(tx, dto, product, alergeno.mlConsumidos, inventoryUsageId);
      }
    } catch (error) {
      console.error(`❌ Error procesando alérgeno ${alergeno.nombre}:`, error);
      throw error;
    }
  }

  // Consumir VITS (mapeado como bacteriana)
  if (calculo.diluyentes.bacteriana > 0) {
    try {
      await processDiluentMovement(tx, dto, 'VITS', calculo.diluyentes.bacteriana, inventoryUsageId);
    } catch (error) {
      console.error(`❌ Error procesando VITS:`, error);
      throw error;
    }
  }
}

// 🎯 PROCESAR TRATAMIENTO GLICERINADO EN FRASCO
async function processGlicerinadoEnFrasco(
  tx: any,
  dto: ProcessUsageDto,
  item: UsageFormItemDto,
  inventoryUsageId: string
) {
  console.log('🔄 Procesando tratamiento Glicerinado en Frasco');
  console.log('🔍 [processGlicerinadoEnFrasco] Item recibido:', JSON.stringify(item, null, 2));
  
  // Obtener datos del frontend
  const frascosString = item.frasco || '1'; // Ej: "Frascos: 1, 2, 3" o "1"
  const frascos = frascosString.includes('Frascos:') 
    ? frascosString.replace('Frascos: ', '').split(', ').map(f => parseInt(f.trim()))
    : [parseInt(frascosString)];
  const cantidad = item.cantidad || 1;
  const alergenos = item.alergenos || [];
  
  console.log('📊 Datos del tratamiento Glicerinado en Frasco:', {
    frascos,
    cantidad,
    alergenos
  });

  // Validar que haya alérgenos seleccionados
  if (alergenos.length === 0) {
    throw new Error('Debe seleccionar al menos un alérgeno para el tratamiento Glicerinado en Frasco');
  }

  // Calcular componentes del tratamiento
  const { calculateGlicerinadoEnFrasco } = await import('../utils/treatmentUtils');
  const calculo = calculateGlicerinadoEnFrasco(frascos, cantidad, alergenos);
  console.log('🧮 Cálculo del tratamiento Glicerinado en Frasco:', calculo);

  // Validar stock de alérgenos
  const missingComponents: string[] = [];
  
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      
      const stock = await tx.stockBySede.findFirst({
        where: {
          productId: alergenoId,
          sedeId: dto.sedeId
        }
      });
      
      const availableStock = stock?.quantity || 0;
      if (availableStock < alergeno.mlConsumidos) {
        missingComponents.push(`${alergeno.nombre} (stock: ${availableStock}, necesario: ${alergeno.mlConsumidos})`);
      }
    } catch (error) {
      missingComponents.push(`${alergeno.nombre} (${error instanceof Error ? error.message : 'error desconocido'})`);
    }
  }
  
  if (missingComponents.length > 0) {
    throw new Error(`Stock insuficiente para tratamiento Glicerinado en Frasco: ${missingComponents.join(', ')}`);
  }

  // Consumir alérgenos
  for (const alergeno of calculo.alergenos) {
    try {
      const alergenoId = await getAlergenIdByName(tx, alergeno.nombre, dto.organizationId, dto.sedeId);
      const product = await tx.product.findUnique({ where: { id: alergenoId } });
      
      if (product) {
        await processMovement(tx, dto, product, alergeno.mlConsumidos, inventoryUsageId);
      }
    } catch (error) {
      console.error(`❌ Error procesando alérgeno ${alergeno.nombre}:`, error);
      throw error;
    }
  }

  // Consumir diluyentes
  if (calculo.diluyentes.evans > 0) {
    try {
      await processDiluentMovement(tx, dto, 'Evans', calculo.diluyentes.evans, inventoryUsageId);
    } catch (error) {
      console.error(`❌ Error procesando Evans:`, error);
      throw error;
    }
  }

  if (calculo.diluyentes.bacteriana > 0) {
    try {
      await processDiluentMovement(tx, dto, 'Bacteriana', calculo.diluyentes.bacteriana, inventoryUsageId);
    } catch (error) {
      console.error(`❌ Error procesando Bacteriana:`, error);
      throw error;
    }
  }
}

 