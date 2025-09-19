import { Request, Response } from 'express';
import { processInventoryUsage } from '../services/inventoryService';
import { PrismaClient, MovementType } from '@prisma/client';
import prisma from '../prisma';
// import { registrarHistorialInventario } from '../utils/historialUtils';

// SOLUCIÓN DEFINITIVA: Acceso directo a req.userId
export const registerInventoryExit = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = `exit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🚀 [${requestId}] Iniciando registerInventoryExit...`);
    
    // SOLUCIÓN ROBUSTA: Acceso directo sin funciones anidadas
    const userId = (req as any).userId;
    const userEmail = (req as any).email;
    const sedeId = (req as any).sedeId;
    
    console.log(`🔍 [${requestId}] DEBUG - Valores directos del middleware:`, { 
      userId, 
      userEmail, 
      sedeId 
    });
    
    if (!userId) {
      console.error(`❌ [${requestId}] ERROR: userId no disponible en el middleware`);
      return res.status(401).json({ 
        error: 'Usuario no autenticado correctamente',
        details: 'userId no disponible en el middleware de autenticación',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📥 [${requestId}] Received data from frontend:`, req.body);
    console.log(`🔍 [${requestId}] DIAGNÓSTICO COMPLETO DE REACCIONES Y ALERGENOS:`);
    console.log(`  - tuvoReaccion:`, req.body.tuvoReaccion);
    console.log(`  - descripcionReaccion:`, req.body.descripcionReaccion);
    console.log(`  - tipo descripcionReaccion:`, typeof req.body.descripcionReaccion);
    console.log(`  - items.length:`, req.body.items?.length);
    if (req.body.items?.[0]) {
      console.log(`  - items[0].alergenos:`, req.body.items[0].alergenos);
      console.log(`  - items[0].allergenIds:`, req.body.items[0].allergenIds);
    }
    console.log(`🔍 [${requestId}] Consultorio info:`, {
      bodyConsultorioId: req.body.consultorioId,
      userConsultorioId: (req as any).userConsultorioId,
      finalConsultorioId: req.body.consultorioId || (req as any).userConsultorioId || null
    });

    // Validación robusta de datos
    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      console.error(`❌ [${requestId}] ERROR: Items inválidos o vacíos`);
      return res.status(400).json({
        error: 'Datos de inventario inválidos',
        details: 'La lista de items es requerida y no puede estar vacía',
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Validar que todos los items tengan productId
    const invalidItems = req.body.items.filter((item: any) => !item.productId);
    if (invalidItems.length > 0) {
      console.error(`❌ [${requestId}] ERROR: Items sin productId:`, invalidItems);
      return res.status(400).json({
        error: 'Datos de inventario inválidos',
        details: 'Todos los items deben tener un productId válido',
        invalidItems,
        requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Adaptar datos del frontend al formato del backend
    const adaptedData = {
      userId: userId,
      userEmail: userEmail,
      tenantId: sedeId,
      sedeId: sedeId,
      organizationId: (req as any).organizationId,
      nombrePaciente: req.body.nombrePaciente,
      tipoTratamiento: req.body.tipoTratamiento,
      observaciones: req.body.observaciones || '',
      tuvoReaccion: req.body.tuvoReaccion || false,
      descripcionReaccion: req.body.descripcionReaccion || '', // ✅ AGREGADO: Campo faltante
      items: req.body.items || [],
      pacienteId: req.body.pacienteId,
      consultorioId: req.body.consultorioId || (req as any).userConsultorioId || null, // Usar el consultorio del formulario o el del usuario
      frontendSedeId: req.body.sedeId
    };

    console.log(`🔄 [${requestId}] Datos adaptados para el backend:`, adaptedData);
    console.log(`🔍 [${requestId}] VERIFICACIÓN POST-ADAPTACIÓN:`);
    console.log(`  - adaptedData.descripcionReaccion:`, adaptedData.descripcionReaccion);
    console.log(`  - adaptedData.items[0]?.alergenos:`, adaptedData.items[0]?.alergenos);

    // Procesar la salida de inventario
    const result = await processInventoryUsage(adaptedData);

    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Resultado del procesamiento (${duration}ms):`, result);

    res.status(200).json({
      success: true,
      message: 'Salida de inventario registrada exitosamente',
      data: result,
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${requestId}] Error en registerInventoryExit (${duration}ms):`, error);
    
    // NO TERMINAR EL PROCESO - solo responder con error
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// Endpoint para obtener entradas de inventario agrupadas por categoría
export async function getInventoryEntriesByCategory(req: Request, res: Response) {
  try {
    const startTime = performance.now()
    console.log('🚀 Backend - Iniciando getInventoryEntriesByCategory...')
    
    // Verificar si se solicita "todos los consultorios"
    const allConsultorios = req.query.allConsultorios === 'true';
    
    // USAR EL SEDEID DE LA QUERY SI ESTÁ DISPONIBLE, SINO USAR TENANTID
    const querySedeId = typeof req.query.sedeId === 'string' ? req.query.sedeId : undefined;
    const sedeId = querySedeId || (req as any).tenantId || 'sede-organizacion-default';
    
    // DEBUG: Verificar qué sedeId se está usando
    console.log('🔍 DEBUG - getInventoryEntriesByCategory:', {
      querySedeId,
      tenantId: (req as any).tenantId,
      finalSedeId: sedeId,
      allConsultorios
    });
    
    let from = typeof req.query.from === 'string' ? req.query.from : undefined;
    let to = typeof req.query.to === 'string' ? req.query.to : undefined;
    
    // Si no se proporcionan fechas, usar el mes actual por defecto
    if (!from || !to) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      from = from || firstDay.toISOString().split('T')[0]
      to = to || lastDay.toISOString().split('T')[0]
    }
    
    // Función helper para crear fechas que incluyan el día completo en hora local
    const createDateRange = (fromDate: string, toDate: string) => {
      // Crear fecha de inicio: desde el inicio del día en hora local de México (UTC-6)
      const fromDateTime = new Date(fromDate + 'T00:00:00-06:00')
      // Crear fecha de fin: hasta el final del día en hora local de México (UTC-6)
      const toDateTime = new Date(toDate + 'T23:59:59.999-06:00')
      
      return {
        gte: fromDateTime,
        lte: toDateTime
      }
    }
    
    // 🎯 FILTRO MULTI-TENANT: Solo sedes de la organización actual
    const organizationId = (req as any).organizationId;
    console.log('🔍 getInventoryEntriesByCategory - Filtrando por organización:', organizationId);
    
    // 🚀 DINÁMICO: Obtener todas las sedes de la organización actual
    const allSedes = await prisma.sede.findMany({
      where: {
        organizacion_id: organizationId
      },
      select: { id: true }
    });
    const allSedeIds = allSedes.map(sede => sede.id);
    console.log('🔍 Sedes de la organización actual:', allSedeIds);
    
    const where = {
      type: MovementType.ENTRY,
      ...(allConsultorios ? { sedeId: { in: allSedeIds } } : { sedeId }),
      ...(from && to ? { createdAt: createDateRange(from, to) } : {}),
      // 🎯 FILTRO MULTI-TENANT: Solo movimientos de productos de la organización actual
      Product: {
        organizacion_id: organizationId
      }
    };
    // Trae todos los movimientos tipo ENTRY con producto - ULTRA-OPTIMIZADO
    const queryStart = performance.now()
    const entries = await prisma.movement.findMany({
      where,
      select: {
        quantity: true,
        totalCost: true,
        createdAt: true,
        Product: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // ULTRA-AGRESIVO: solo 200 registros para tablas súper rápidas
    }) as any[];
    
    const queryTime = performance.now() - queryStart
    console.log(`�� Backend - Query de entradas completada en ${queryTime.toFixed(2)}ms`)
    // Agrupa por categoría
    const grouped: { [key: string]: any } = {};
    console.log('🔍 Backend - Entries encontradas:', entries.length);
    console.log('🔍 Backend - Primera entry:', entries[0]);
    
    for (const entry of entries) {
      const category = entry.Product?.category || 'Sin categoría';
      console.log('🔍 Backend - Procesando entry con categoría:', category, 'Product:', entry.Product);
      
      if (!grouped[category]) {
        grouped[category] = {
          category,
          totalQuantity: 0,
          totalValue: 0,
          entries: []
        };
      }
      grouped[category].totalQuantity += Number(entry.quantity);
      grouped[category].totalValue += Number(entry.totalCost);
      grouped[category].entries.push({
        name: entry.Product?.name || 'Desconocido',
        quantity: Number(entry.quantity),
        totalValue: Number(entry.totalCost),
        createdAt: entry.createdAt
      });
    }
    
    console.log('🔍 Backend - Objeto grouped resultante:', grouped);
    console.log('🔍 Backend - Object.values(grouped):', Object.values(grouped));
    const processingTime = performance.now() - startTime
    console.log(`✅ Backend - getInventoryEntriesByCategory completado en ${processingTime.toFixed(2)}ms`)
    
    // Si no hay datos, devuelve array vacío
    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error en getInventoryEntriesByCategory:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}

// Endpoint para obtener salidas de inventario agrupadas por categoría
export async function getInventoryExitsByCategory(req: Request, res: Response) {
  try {
    const sedeId = (req as any).sedeId;
    const { from, to, allConsultorios } = req.query;
    
    console.log('🚀 Backend - Iniciando getInventoryExitsByCategory...');
    
    const params = {
      sedeId,
      from: from as string,
      to: to as string,
      allConsultorios: allConsultorios === 'true'
    };
    
    console.log('🔍 Parámetros:', params);

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);
    endDate.setHours(23, 59, 59, 999);

    // 🎯 FILTRO MULTI-TENANT: Solo sedes de la organización actual
    const organizationId = (req as any).organizationId;
    console.log('🔍 getInventoryExitsByCategory - Filtrando por organización:', organizationId);

    // 🎯 CORRECCIÓN: Si es "todos los consultorios", buscar en TODOS los sedeId disponibles
    let sedeIdWhere: any;
    if (allConsultorios || sedeId === 'todos') {
      
      // 🚀 DINÁMICO: Obtener todos los sedeId disponibles de la base de datos
      const allSedes = await prisma.sede.findMany({
        where: {
          organizacion_id: organizationId
        },
        select: { id: true }
      });
      const allSedeIds = allSedes.map(sede => sede.id);
      
      sedeIdWhere = {
        in: allSedeIds
      };
      console.log('🔍 Buscando en TODOS los consultorios (dinámico):', sedeIdWhere);
    } else {
      sedeIdWhere = sedeId;
      console.log('🔍 Buscando en consultorio específico:', sedeIdWhere);
    }

    const whereClause: any = {
      type: MovementType.EXIT,
      sedeId: sedeIdWhere,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    console.log('🔍 Buscando movimientos con where:', whereClause);

    const startTime = Date.now();
    
    const movements = await prisma.movement.findMany({
      where: {
        ...whereClause,
        // 🎯 FILTRO MULTI-TENANT: Solo movimientos de productos de la organización actual
        Product: {
          organizacion_id: organizationId
        }
      },
      select: {
        id: true,
        quantity: true,
        totalCost: true,
        productId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    const queryTime = Date.now() - startTime;
    console.log(`🔍 Backend - Query de salidas completada en ${queryTime}ms, ${movements.length} movimientos encontrados`);

    const productIds = [...new Set(movements.map(m => m.productId))];
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        category: true
      }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const groupedData = movements.reduce((acc, movement) => {
      const product = productMap.get(movement.productId);
      if (!product || !product.category) return acc;

      const category = product.category;
      
      if (!acc[category]) {
        acc[category] = {
          category,
          totalQuantity: 0,
          totalValue: 0,
          products: []
        };
      }

      // Convertir explícitamente a números para evitar concatenación
      const quantity = Number(movement.quantity) || 0;
      const totalCost = Number(movement.totalCost) || 0;
      
      // Logging para debug
      console.log('🔧 Procesando movimiento:', {
        productId: movement.productId,
        originalQuantity: movement.quantity,
        convertedQuantity: quantity,
        originalTotalCost: movement.totalCost,
        convertedTotalCost: totalCost
      });
      
      acc[category].totalQuantity += quantity;
      acc[category].totalValue += totalCost;

      const existingProduct = acc[category].products.find((p: any) => p.id === product.id);
      if (existingProduct) {
        existingProduct.quantity += quantity;
        existingProduct.totalValue += totalCost;
      } else {
        acc[category].products.push({
          id: product.id,
          name: product.name,
          quantity: quantity,
          totalValue: totalCost
        });
      }

      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(groupedData);
    
    console.log('🔍 Datos agrupados:', JSON.stringify(result, null, 2));
    console.log(`✅ Backend - getInventoryExitsByCategory completado en ${Date.now() - startTime}ms`);

    res.json(result);
  } catch (error) {
    console.error('Error en getInventoryExitsByCategory:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Endpoint para obtener detalles completos de entradas por categoría
export async function getInventoryEntriesDetailByCategory(req: Request, res: Response) {
  try {
    console.log('🔍 getInventoryEntriesDetailByCategory ejecutándose');
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    let allConsultorios = req.query.allConsultorios === 'true';
    // USAR SIEMPRE EL TENANTID DEL MIDDLEWARE - NO EL DEL FRONTEND
    const sedeId = (req as any).tenantId || 'sede-organizacion-default';
    let from = typeof req.query.from === 'string' ? req.query.from : undefined;
    let to = typeof req.query.to === 'string' ? req.query.to : undefined;
    
    if (!category) {
      return res.status(400).json({ error: 'Categoría es requerida' });
    }
    
    // Si no se proporcionan fechas, usar el mes actual por defecto
    if (!from || !to) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      from = from || firstDay.toISOString().split('T')[0]
      to = to || lastDay.toISOString().split('T')[0]
    }
    
    console.log('🔍 Parámetros:', { category, sedeId, from, to, allConsultorios });
    console.log('🔍 allConsultorios recibido:', req.query.allConsultorios);
    console.log('🔍 allConsultorios procesado:', allConsultorios);
    
    // Verificar si allConsultorios se está procesando correctamente
    if (req.query.allConsultorios === 'true' && !allConsultorios) {
      console.log('🔍 ERROR: allConsultorios no se está procesando correctamente');
      allConsultorios = true;
    }
    
    // Función helper para crear fechas que incluyan el día completo en hora local
    const createDateRange = (fromDate: string, toDate: string) => {
      const fromDateTime = new Date(fromDate + 'T00:00:00-06:00') // Hora local de México (UTC-6)
      const toDateTime = new Date(toDate + 'T23:59:59.999-06:00') // Hora local de México (UTC-6)
      return {
        gte: fromDateTime,
        lte: toDateTime
      }
    }
    
    // Manejo robusto de categorías para productos sin categoría
    const categoryFilter = category === 'Sin categoría' 
      ? { OR: [{ category: null }, { category: '' }, { category: 'Sin categoría' }] }
      : { category: category };
    
    // 🎯 FILTRO MULTI-TENANT: Solo sedes de la organización actual
    const organizationId = (req as any).organizationId;
    console.log('🔍 getInventoryEntriesDetailByCategory - Filtrando por organización:', organizationId);
    
    // Construir el where clause según si es todos los consultorios o uno específico
    let where: any = {
      type: MovementType.ENTRY,
      ...(from && to ? { createdAt: createDateRange(from, to) } : {}),
      Product: categoryFilter
    };
    
    if (allConsultorios) {
      
      // 🚀 DINÁMICO: Obtener todos los sedeId disponibles de la base de datos
      const allSedes = await prisma.sede.findMany({
        where: {
          organizacion_id: organizationId
        },
        select: { id: true }
      });
      const allSedeIds = allSedes.map(sede => sede.id);
      
      where.sedeId = { in: allSedeIds };
      console.log('🔍 Buscando en TODOS los consultorios (dinámico):', allSedeIds);
    } else {
      // Para consultorio específico
      where.sedeId = sedeId;
      console.log('🔍 Buscando en consultorio específico con sedeId:', sedeId);
    }
    
    console.log('🔍 Buscando entradas detalladas con where:', where);
    const entries = await prisma.movement.findMany({
      where: {
        ...where,
        // 🎯 FILTRO MULTI-TENANT: Solo movimientos de productos de la organización actual
        Product: {
          ...where.Product,
          organizacion_id: organizationId
        }
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            category: true,
            costPerUnit: true
          }
        },
        Consultorio: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limitar resultados para performance
    }) as any[];
    
    console.log('🔍 Entradas encontradas:', entries.length);
    
    // Resolver nombres de consultorios de manera robusta
    const consultorioIds = [...new Set(entries.map(entry => entry.consultorioId).filter(Boolean))];
    console.log('🔍 consultorioIds encontrados:', consultorioIds);
    console.log('🔍 consultorioIds filtrados:', entries.map(entry => entry.consultorioId));
    
    const consultorios = await prisma.consultorio.findMany({
      where: { id: { in: consultorioIds } },
      select: { id: true, nombre: true }
    });
    
    console.log('🔍 consultorios encontrados:', consultorios);
    const consultorioMap = new Map(consultorios.map(c => [c.id, c.nombre]));
    
    const detailedEntries = entries.map(entry => ({
      id: entry.id,
      name: entry.Product?.name || 'Desconocido',
      quantity: Number(entry.quantity),
      totalValue: Number(entry.totalCost),
      unitCost: Number(entry.unitCost),
      batchNumber: entry.batchNumber,
      expiryDate: entry.expiryDate,
      createdAt: entry.createdAt,
      userId: entry.userId,
      sedeId: entry.sedeId,
      consultorioId: entry.consultorioId,
      consultorioNombre: entry.consultorioId ? (consultorioMap.get(entry.consultorioId) || 'Consultorio no encontrado') : 'Sin consultorio'
    }));
    
    res.json(detailedEntries);
  } catch (error) {
    console.error('Error en getInventoryEntriesDetailByCategory:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}

// Endpoint para obtener detalles completos de salidas por categoría
export async function getInventoryExitsDetailByCategory(req: Request, res: Response) {
  try {
    console.log('🔍 getInventoryExitsDetailByCategory ejecutándose');
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    let allConsultorios = req.query.allConsultorios === 'true';
    // USAR SIEMPRE EL SEDEID DEL MIDDLEWARE - NO EL DEL FRONTEND
    const sedeId = (req as any).sedeId || 'sede-organizacion-default';
    let from = typeof req.query.from === 'string' ? req.query.from : undefined;
    let to = typeof req.query.to === 'string' ? req.query.to : undefined;
    
    if (!category) {
      return res.status(400).json({ error: 'Categoría es requerida' });
    }
    
    // Si no se proporcionan fechas, usar el mes actual por defecto
    if (!from || !to) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      from = from || firstDay.toISOString().split('T')[0]
      to = to || lastDay.toISOString().split('T')[0]
    }
    
    console.log('🔍 Parámetros:', { category, sedeId, from, to, allConsultorios });
    console.log('🔍 allConsultorios recibido:', req.query.allConsultorios);
    console.log('🔍 allConsultorios procesado:', allConsultorios);
    
    // Verificar si allConsultorios se está procesando correctamente
    if (req.query.allConsultorios === 'true' && !allConsultorios) {
      console.log('🔍 ERROR: allConsultorios no se está procesando correctamente');
      allConsultorios = true;
    }
    
    // Función helper para crear fechas que incluyan el día completo en hora local
    const createDateRange = (fromDate: string, toDate: string) => {
      const fromDateTime = new Date(fromDate + 'T00:00:00-06:00') // Hora local de México (UTC-6)
      const toDateTime = new Date(toDate + 'T23:59:59.999-06:00') // Hora local de México (UTC-6)
      return {
        gte: fromDateTime,
        lte: toDateTime
      }
    }
    
    // Manejo robusto de categorías para productos sin categoría
    const categoryFilter = category === 'Sin categoría' 
      ? { OR: [{ category: null }, { category: '' }, { category: 'Sin categoría' }] }
      : { category: category };
    
    // 🎯 FILTRO MULTI-TENANT: Solo sedes de la organización actual
    const organizationId = (req as any).organizationId;
    console.log('🔍 getInventoryExitsDetailByCategory - Filtrando por organización:', organizationId);
    
    // Construir el where clause según si es todos los consultorios o uno específico
    let where: any = {
      type: MovementType.EXIT,
      ...(from && to ? { createdAt: createDateRange(from, to) } : {}),
      Product: categoryFilter
    };
    
    if (allConsultorios) {
      
      // 🚀 DINÁMICO: Obtener todos los sedeId disponibles de la base de datos
      const allSedes = await prisma.sede.findMany({
        where: {
          organizacion_id: organizationId
        },
        select: { id: true }
      });
      const allSedeIds = allSedes.map(sede => sede.id);
      
      where.sedeId = { in: allSedeIds };
      console.log('🔍 Buscando en TODOS los consultorios (dinámico):', allSedeIds);
    } else {
      // Para consultorio específico
      where.sedeId = sedeId;
      console.log('🔍 Buscando en consultorio específico con sedeId:', sedeId);
    }
    
    console.log('🔍 Buscando salidas detalladas con where:', where);
    const exits = await prisma.movement.findMany({
      where: {
        ...where,
        // 🎯 FILTRO MULTI-TENANT: Solo movimientos de productos de la organización actual
        Product: {
          ...where.Product,
          organizacion_id: organizationId
        }
      },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            category: true,
            costPerUnit: true
          }
        },
        Consultorio: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limitar resultados para performance
    }) as any[];
    
    console.log('🔍 Salidas encontradas:', exits.length);
    
    // Logging para debug de valores
    exits.forEach((exit, index) => {
      console.log(`🔧 Salida ${index + 1}:`, {
        productName: exit.Product?.name,
        originalQuantity: exit.quantity,
        convertedQuantity: Number(exit.quantity),
        originalTotalCost: exit.totalCost,
        convertedTotalCost: Number(exit.totalCost),
        consultorioId: exit.consultorioId,
        consultorioNombre: exit.Consultorio?.nombre
      });
    });
    
    const detailedExits = exits.map(exit => ({
      id: exit.id,
      name: exit.Product?.name || 'Desconocido',
      quantity: Number(exit.quantity),
      totalValue: Number(exit.totalCost),
      unitCost: Number(exit.unitCost),
      batchNumber: exit.batchNumber,
      expiryDate: exit.expiryDate,
      createdAt: exit.createdAt,
      userId: exit.userId,
      sedeId: exit.sedeId,
      consultorioId: exit.consultorioId,
      consultorioNombre: exit.Consultorio?.nombre || 'Sin consultorio'
    }));
    
    res.json(detailedExits);
  } catch (error) {
    console.error('Error en getInventoryExitsDetailByCategory:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
  }
} 

export async function searchProducts(req: Request, res: Response) {
  try {
    const { q } = req.query
    const organizationId = (req as any).organizationId

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' })
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' })
    }

    const products = await prisma.product.findMany({
      where: {
        organizacion_id: organizationId, // ✅ ARREGLADO: Filtrar por organización
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        costPerUnit: true,
        unit: true,
        minStockLevel: true
      },
      orderBy: [
        { name: 'asc' },
        { category: 'asc' }
      ],
      take: 10
    })

    res.json(products)
  } catch (error: any) {
    console.error('Error en searchProducts:', error)
    res.status(500).json({ error: error.message })
  }
} 
      unitCost: Number(exit.unitCost),
      batchNumber: exit.batchNumber,
      expiryDate: exit.expiryDate,
      createdAt: exit.createdAt,
      userId: exit.userId,
      sedeId: exit.sedeId,
      consultorioId: exit.consultorioId,
      consultorioNombre: exit.Consultorio?.nombre || 'Sin consultorio'
    }));
    
    res.json(detailedExits);
  } catch (error) {
    console.error('Error en getInventoryExitsDetailByCategory:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
  }
} 

export async function searchProducts(req: Request, res: Response) {
  try {
    const { q } = req.query
    const organizationId = (req as any).organizationId

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' })
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' })
    }

    const products = await prisma.product.findMany({
      where: {
        organizacion_id: organizationId, // ✅ ARREGLADO: Filtrar por organización
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        costPerUnit: true,
        unit: true,
        minStockLevel: true
      },
      orderBy: [
        { name: 'asc' },
        { category: 'asc' }
      ],
      take: 10
    })

    res.json(products)
  } catch (error: any) {
    console.error('Error en searchProducts:', error)
    res.status(500).json({ error: error.message })
  }
} 