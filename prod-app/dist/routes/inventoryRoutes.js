"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const prisma_1 = __importDefault(require("../prisma"));
const library_1 = require("@prisma/client/runtime/library");
const uuid_1 = require("uuid");
const cacheService_1 = require("../services/cacheService");
const inventoryController_2 = require("../controllers/inventoryController");
const cache_1 = require("../utils/cache");
// import { registrarHistorialInventario } from '../utils/historialUtils';
// Usar la instancia global del servicio de caché
const router = (0, express_1.Router)();
exports.inventoryRoutes = router;
// Ruta para registrar salidas de inventario
router.post('/use', inventoryController_1.registerInventoryExit);
// GET /products - obtener todos los productos (disponibles globalmente)
router.get('/products', async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany();
        res.json(products);
    }
    catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});
// GET /products/category/:category - obtener productos por categoría
router.get('/products/category/:category', async (req, res) => {
    try {
        const category = req.params.category?.trim();
        if (!category)
            return res.status(400).json({ error: 'Categoría requerida' });
        const products = await prisma_1.default.product.findMany({
            where: {
                category: { equals: category },
            },
        });
        res.json(products);
    }
    catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        res.status(500).json({ error: 'Error al obtener productos por categoría' });
    }
});
// Ruta para buscar productos
router.get('/products/search', inventoryController_2.searchProducts);
// GET /stock - obtener stock por sede del usuario autenticado
router.get('/stock', async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id: userId },
            select: { email: true }
        });
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        // Usar sedeId real del usuario autenticado - COMPLETAMENTE DINÁMICO
        const sedeId = req.tenantId;
        if (!sedeId) {
            return res.status(400).json({ error: 'SedeId requerido' });
        }
        const stock = await prisma_1.default.stockBySede.findMany({
            where: { sedeId: sedeId },
            include: { Product: true }
        });
        res.json(stock);
    }
    catch (error) {
        console.error('Error al obtener stock:', error);
        res.status(500).json({ error: 'Error al obtener stock' });
    }
});
// POST /inventory-entry/batch - registrar entradas de inventario en lote
router.post('/inventory-entry/batch', async (req, res) => {
    try {
        const { entries, entryDate } = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'No hay entradas para registrar' });
        }
        // CACHÉ: Invalidar caché del dashboard antes de procesar
        cacheService_1.cacheService.clear();
        // Invalidar cache de dashboard específico
        const { invalidateCacheByPrefix } = require('../utils/cache');
        invalidateCacheByPrefix('dashboard');
        const results = [];
        for (const entry of entries) {
            // DEBUG: Log del userId que se está recibiendo
            console.log('🔍 DEBUG - userId recibido:', entry.userId);
            console.log('🔍 DEBUG - entry completo:', JSON.stringify(entry, null, 2));
            // Obtener información del usuario desde el middleware de tenant
            const user = req.user;
            const tenantId = req.tenantId;
            if (!user) {
                return res.status(401).json({ error: 'Información de usuario no disponible' });
            }
            // USAR EL SEDEID ENVIADO POR EL FRONTEND EN LUGAR DEL TENANTID
            const sedeId = entry.sedeId || tenantId;
            console.log('🔍 DEBUG BACKEND - Procesando entrada:', {
                productId: entry.productId,
                quantity: entry.quantity,
                frontendSedeId: entry.sedeId, // SedeId que viene del frontend
                backendTenantId: tenantId, // TenantId del middleware
                effectiveSedeId: sedeId // SedeId que se usará
            });
            console.log('🔍 DEBUG - Usuario autenticado:', {
                userId: user.id,
                email: user.email,
                tenantId,
                sedeId,
                organizationId: req.organizationId
            });
            // Buscar el producto para obtener costPerUnit
            const product = await prisma_1.default.product.findUnique({ where: { id: String(entry.productId) } });
            if (!product) {
                return res.status(400).json({ error: `Producto no encontrado: ${entry.productId}` });
            }
            const quantityDecimal = new library_1.Decimal(entry.quantity);
            const unitCost = new library_1.Decimal(entry.unitCost ?? product.costPerUnit);
            const totalCost = unitCost.mul(quantityDecimal);
            // Función para obtener el consultorioId correcto del usuario autenticado
            const getConsultorioIdFromUser = () => {
                // Usar el consultorioId del usuario autenticado
                return user.consultorio_id || '660e8400-e29b-41d4-a716-446655440000'; // Fallback al consultorio principal
            };
            // 1. Registrar movimiento ENTRY
            const movement = await prisma_1.default.movement.create({
                data: {
                    id: generateId(),
                    userId: user.id,
                    sedeId: sedeId,
                    consultorioId: getConsultorioIdFromUser(), // Usar consultorioId del usuario autenticado
                    productId: String(entry.productId),
                    type: 'ENTRY',
                    quantity: quantityDecimal.toNumber(),
                    unitCost: unitCost.toNumber(),
                    totalCost: totalCost.toNumber(),
                    batchNumber: entry.batchNumber || undefined,
                    expiryDate: entry.expiryDate ? new Date(entry.expiryDate) : undefined,
                    createdAt: entryDate ? new Date(entryDate) : new Date().toISOString(),
                },
            });
            // Registrar en historial
            // await registrarHistorialInventario(
            //   'CREACION',
            //   null,
            //   movement,
            //   user.id,
            //   movement.id,
            //   {
            //     producto_id: String(entry.productId),
            //     producto_nombre: product.name,
            //     cantidad: quantityDecimal.toNumber(),
            //     tipo_movimiento: 'ENTRADA',
            //     consultorio_id: getConsultorioIdFromSedeId(sedeId) || undefined,
            //     motivo_cambio: 'Entrada de inventario registrada'
            //   }
            // );
            // 2. Actualizar stock en StockBySede
            await prisma_1.default.stockBySede.upsert({
                where: {
                    productId_sedeId: {
                        productId: String(entry.productId),
                        sedeId: sedeId,
                    },
                },
                update: {
                    quantity: { increment: quantityDecimal.toNumber() },
                    updatedAt: new Date(),
                },
                create: {
                    id: `stock-${entry.productId}-${sedeId}`,
                    productId: String(entry.productId),
                    sedeId: sedeId,
                    quantity: quantityDecimal.toNumber(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            // 3. Registrar caducidad si aplica
            if (entry.expiryDate) {
                await prisma_1.default.productExpiration.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        productId: String(entry.productId),
                        sedeId: sedeId,
                        batchNumber: entry.batchNumber || 'default',
                        expiryDate: new Date(entry.expiryDate),
                        quantity: Number(entry.quantity),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
            results.push(movement);
        }
        res.status(201).json({ success: true, data: results });
    }
    catch (error) {
        console.error('Error al registrar entradas de inventario:', error);
        res.status(500).json({ error: 'Error al registrar entradas de inventario' });
    }
});
// GET /inventory-entry/by-category - resumen de entradas agrupadas por categoría
router.get('/inventory-entry/by-category', inventoryController_1.getInventoryEntriesByCategory);
// GET /exit/by-category - resumen de salidas agrupadas por categoría
router.get('/exit/by-category', (req, res, next) => {
    console.log('🔍 RUTA EJECUTÁNDOSE: /exit/by-category');
    next();
}, inventoryController_1.getInventoryExitsByCategory);
// GET /inventory-entry/detail/by-category - detalles completos de entradas por categoría
router.get('/inventory-entry/detail/by-category', inventoryController_1.getInventoryEntriesDetailByCategory);
// GET /exit/detail/by-category - detalles completos de salidas por categoría
router.get('/exit/detail/by-category', inventoryController_1.getInventoryExitsDetailByCategory);
// 🚀 SISTEMA DE NIVEL AMAZON - DASHBOARD ULTRA-OPTIMIZADO
router.get('/dashboard/public', async (req, res) => {
    try {
        const { sedeId, from, to } = req.query;
        // CORREGIDO: Usar el sedeId del frontend si está disponible, sino usar el tenantId del middleware
        const userSedeId = sedeId || req.tenantId || 'sede-organizacion-default';
        console.log('🔍 Dashboard - Usando tenantId del middleware:', {
            tenantIdFromMiddleware: req.tenantId,
            sedeIdFromFrontend: sedeId,
            sedeIdFinal: userSedeId,
            from: from,
            to: to
        });
        // 🚀 SISTEMA DE CACHÉ INTELIGENTE - NIVEL AMAZON
        const cacheKey = (0, cache_1.getCacheKey)('dashboard', { sedeId: userSedeId, from, to });
        const cached = cache_1.cache.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache HIT - Dashboard servido desde caché (Amazon-level performance)');
            return res.json(cached);
        }
        console.log('🚀 Cache MISS - Generando dashboard en tiempo real (Amazon-level accuracy)');
        // Función helper para crear fechas que incluyan el día completo
        const createDateRange = (fromDate, toDate) => {
            const fromDateTime = new Date(fromDate + 'T00:00:00');
            const toDateTime = new Date(toDate + 'T23:59:59.999');
            return {
                gte: fromDateTime,
                lte: toDateTime
            };
        };
        // 🚀 DINÁMICO: Obtener todos los sedeId disponibles de la base de datos
        let allSedeIds = [];
        if (userSedeId === 'todos') {
            const allSedes = await prisma_1.default.sede.findMany({
                select: { id: true, name: true }
            });
            allSedeIds = allSedes.map(sede => sede.id);
            console.log('🔍 Dashboard - SedeIds dinámicos obtenidos:', allSedes);
            console.log('🔍 Dashboard - Array de IDs:', allSedeIds);
        }
        // 🚀 SISTEMA ROBUSTO Y ESCALABLE - FILTROS DINÁMICOS
        const whereMovements = {
            ...(userSedeId === 'todos'
                ? { sedeId: { in: allSedeIds } }
                : { sedeId: userSedeId }),
            ...(from && to ? { createdAt: createDateRange(String(from), String(to)) } : {}),
        };
        // 🔍 DEBUG: Log del filtro de movimientos para diagnosticar
        console.log('🔍 Dashboard - Filtro de movimientos:', JSON.stringify(whereMovements, null, 2));
        console.log('🔍 Dashboard - Parámetros recibidos:', { sedeId, from, to, userSedeId });
        console.log('🔍 Dashboard - Fechas procesadas:', {
            from: from ? new Date(String(from) + 'T00:00:00') : null,
            to: to ? new Date(String(to) + 'T23:59:59.999') : null
        });
        // OPTIMIZACIÓN: Ejecutar queries ultra-optimizadas en paralelo
        const startTime = performance.now();
        console.log('🚀 Backend - Iniciando queries del dashboard...');
        // OPTIMIZACIÓN CRÍTICA: Obtener solo productos con stock o que han tenido movimientos
        const allProducts = await prisma_1.default.product.findMany({
            where: {
                OR: [
                    {
                        StockBySede: {
                            some: {
                                sedeId: userSedeId === 'todos'
                                    ? { in: allSedeIds }
                                    : userSedeId,
                                quantity: { gt: 0 }
                            }
                        }
                    },
                    {
                        Movement: {
                            some: {
                                sedeId: userSedeId === 'todos'
                                    ? { in: allSedeIds }
                                    : userSedeId
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                type: true,
                unit: true,
                description: true,
                costPerUnit: true,
                minStockLevel: true,
                category: true,
                createdAt: true,
                updatedAt: true
            },
            take: 100 // LIMITAR a 100 productos máximo para velocidad
        });
        const [stockBySede, movements, expirationAlerts] = await Promise.all([
            // Stock por producto y sede - QUERY ULTRA-OPTIMIZADA
            (async () => {
                const queryStart = performance.now();
                const result = await prisma_1.default.stockBySede.findMany({
                    where: {
                        sedeId: userSedeId === 'todos'
                            ? { in: allSedeIds }
                            : userSedeId
                    },
                    select: {
                        quantity: true,
                        Product: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                unit: true,
                                description: true,
                                costPerUnit: true,
                                minStockLevel: true,
                                category: true,
                                createdAt: true,
                                updatedAt: true
                            }
                        }
                    },
                    take: 25 // Ultra-agresivo: solo 25 productos
                });
                console.log(`📊 Stock query completada en ${(performance.now() - queryStart).toFixed(2)}ms`);
                return result;
            })(),
            // Movimientos filtrados por fecha - QUERY MEJORADA
            (async () => {
                const queryStart = performance.now();
                // MEJORADO: Incluir más información para las tablas
                const result = await prisma_1.default.movement.findMany({
                    where: whereMovements,
                    select: {
                        id: true,
                        type: true,
                        quantity: true,
                        totalCost: true,
                        productId: true,
                        batchNumber: true,
                        createdAt: true,
                        Product: {
                            select: {
                                name: true,
                                category: true,
                                unit: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                    // 🚨 CRÍTICO: Removido take: 100 para obtener TODOS los movimientos
                });
                console.log(`📈 Movimientos query completada en ${(performance.now() - queryStart).toFixed(2)}ms`);
                console.log(`🔍 Dashboard - Total movimientos obtenidos de BD: ${result.length}`);
                console.log(`🔍 Dashboard - Primeros 5 movimientos:`, result.slice(0, 5).map(m => ({
                    id: m.id,
                    type: m.type,
                    totalCost: m.totalCost,
                    productName: m.Product?.name,
                    createdAt: m.createdAt
                })));
                return result;
            })(),
            // Alertas de caducidad - QUERY ULTRA-OPTIMIZADA
            (async () => {
                const queryStart = performance.now();
                const result = await prisma_1.default.productExpiration.findMany({
                    where: {
                        sedeId: userSedeId === 'todos'
                            ? { in: allSedeIds }
                            : userSedeId,
                        expiryDate: { lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180) },
                        quantity: { gt: 0 }
                    },
                    select: {
                        id: true,
                        productId: true,
                        batchNumber: true,
                        expiryDate: true,
                        quantity: true,
                        Product: {
                            select: {
                                name: true,
                                category: true
                            }
                        }
                    },
                    orderBy: { expiryDate: 'asc' },
                    take: 15 // ULTRA-AGRESIVO: solo 15 alertas para máxima velocidad
                });
                console.log(`⚠️ Expiración query completada en ${(performance.now() - queryStart).toFixed(2)}ms`);
                return result;
            })()
        ]);
        const queriesTime = performance.now() - startTime;
        console.log(`⚡ Backend - Todas las queries completadas en ${queriesTime.toFixed(2)}ms`);
        // OPTIMIZACIÓN: Procesar datos de manera ultra-eficiente
        const processingStart = performance.now();
        const entries = movements.filter(m => m.type === 'ENTRY');
        const exits = movements.filter(m => m.type === 'EXIT');
        // 🔍 DEBUG: Log de movimientos obtenidos
        console.log('🔍 Dashboard - Total movimientos obtenidos:', movements.length);
        console.log('🔍 Dashboard - Entradas encontradas:', entries.length);
        console.log('🔍 Dashboard - Salidas encontradas:', exits.length);
        console.log('🔍 Dashboard - Primeras 3 entradas:', entries.slice(0, 3).map(e => ({
            productId: e.productId,
            totalCost: e.totalCost,
            createdAt: e.createdAt,
            type: e.type
        })));
        console.log('🔍 Dashboard - Primeras 3 salidas:', exits.slice(0, 3).map(e => ({
            productId: e.productId,
            totalCost: e.totalCost,
            createdAt: e.createdAt,
            type: e.type
        })));
        // Crear un mapa de stock para acceso rápido
        const stockMap = new Map();
        for (const s of stockBySede) {
            stockMap.set(s.Product?.id, Number(s.quantity));
        }
        // 🚀 CORREGIDO: Obtener TODAS las entradas históricas para calcular el valor real del inventario actual
        // NO filtrar por fechas para el cálculo del inventario actual
        const allHistoricalEntries = await prisma_1.default.movement.findMany({
            where: {
                ...(userSedeId === 'todos'
                    ? { sedeId: { in: allSedeIds } }
                    : { sedeId: userSedeId }),
                type: 'ENTRY' // Solo entradas para calcular el valor real del inventario
            },
            select: {
                productId: true,
                totalCost: true
            }
        });
        // Crear el mapa de valores reales por producto basado en TODAS las entradas históricas
        const realValueMap = new Map();
        for (const entry of allHistoricalEntries) {
            const productId = entry.productId;
            const currentValue = realValueMap.get(productId) || 0;
            realValueMap.set(productId, currentValue + Number(entry.totalCost));
        }
        // DEBUG: Verificar valores reales por producto
        console.log('🔍 DEBUG - Valores reales por producto (TODAS las entradas históricas):', Object.fromEntries(realValueMap));
        console.log('🔍 DEBUG - Entradas históricas procesadas:', allHistoricalEntries.length);
        console.log('🔍 DEBUG - Entradas en rango de fechas:', entries.length);
        // Productos en inventario con stock y valor calculado - INCLUYENDO TODOS LOS PRODUCTOS
        // MEJORADO: Usar valor real de las entradas para cada producto
        const inventory = allProducts.map(product => {
            const stockQuantity = stockMap.get(product.id) || 0;
            const realValue = realValueMap.get(product.id) || 0;
            return {
                id: product.id,
                name: product.name,
                type: product.type,
                unit: product.unit,
                description: product.description,
                costPerUnit: product.costPerUnit,
                minStockLevel: product.minStockLevel,
                category: product.category,
                quantity: stockQuantity,
                totalValue: realValue > 0 ? realValue : (stockQuantity * Number(product.costPerUnit || 0)),
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            };
        });
        // Métricas principales - OPTIMIZADAS
        // CORREGIDO: Calcular valor total basándose en el stock real de todas las sedes
        const totalInventoryValue = stockBySede.reduce((sum, stock) => {
            const product = stock.Product;
            if (!product)
                return sum;
            const realValue = realValueMap.get(product.id) || 0;
            if (realValue > 0) {
                // Si hay valor real de entradas, usar ese valor
                return sum + realValue;
            }
            else {
                // Si no hay valor real, usar el precio base del producto
                return sum + (Number(stock.quantity) * Number(product.costPerUnit || 0));
            }
        }, 0);
        // 🚀 SISTEMA ROBUSTO Y ESCALABLE - CÁLCULO DE MÉTRICAS PRECISAS
        // Obtener TODOS los movimientos para cálculos precisos (sin límites)
        const allMovementsForTotals = await prisma_1.default.movement.findMany({
            where: whereMovements,
            select: {
                type: true,
                totalCost: true,
                createdAt: true
            }
        });
        console.log('🔍 Dashboard - Total movimientos para cálculos:', allMovementsForTotals.length);
        // Calcular totales precisos
        const allEntries = allMovementsForTotals.filter(m => m.type === 'ENTRY');
        const allExits = allMovementsForTotals.filter(m => m.type === 'EXIT');
        const totalEnteredInventoryCost = allEntries.reduce((sum, m) => sum + Number(m.totalCost || 0), 0);
        const totalUsedInventoryCost = allExits.reduce((sum, m) => sum + Number(m.totalCost || 0), 0);
        // 🚀 MÉTRICAS AVANZADAS - NIVEL AMAZON
        const metrics = {
            totalEntries: allEntries.length,
            totalExits: allExits.length,
            totalEnteredInventoryCost,
            totalUsedInventoryCost,
            // Análisis de tendencias
            averageEntryValue: allEntries.length > 0 ? totalEnteredInventoryCost / allEntries.length : 0,
            averageExitValue: allExits.length > 0 ? totalUsedInventoryCost / allExits.length : 0,
            // Eficiencia del inventario
            inventoryTurnover: totalInventoryValue > 0 ? totalUsedInventoryCost / totalInventoryValue : 0,
            // Tiempo de respuesta
            processingTime: performance.now() - startTime
        };
        console.log('🚀 Dashboard - Métricas avanzadas (Amazon-level):', metrics);
        // 🔍 DEBUG: Log de cálculos finales
        console.log('🔍 Dashboard - Cálculo final de costos:');
        console.log('  - totalEnteredInventoryCost:', totalEnteredInventoryCost);
        console.log('  - totalUsedInventoryCost:', totalUsedInventoryCost);
        console.log('  - totalInventoryValue:', totalInventoryValue);
        // 🚀 CORREGIDO: Agrupar TODOS los productos por categoría usando el valor real del inventario actual
        // NO filtrar por fechas para el cálculo del inventario por categoría
        const categoryMap = new Map();
        for (const product of allProducts) {
            const cat = product.category || 'Sin categoría';
            const current = categoryMap.get(cat) || {
                category: cat,
                totalQuantity: 0,
                totalValue: 0,
                totalProducts: 0
            };
            const stockQuantity = stockMap.get(product.id) || 0;
            current.totalQuantity += stockQuantity;
            // 🚀 CORREGIDO: Usar valor real de TODAS las entradas históricas (no filtrado por fechas)
            const realValue = realValueMap.get(product.id) || 0;
            if (realValue > 0) {
                // Si hay entradas reales, usar ese valor (basado en TODAS las entradas históricas)
                current.totalValue += realValue;
            }
            else {
                // Si no hay entradas, usar el precio base como fallback
                current.totalValue += stockQuantity * Number(product.costPerUnit || 0);
            }
            current.totalProducts += 1;
            categoryMap.set(cat, current);
        }
        const inventoryByCategory = Array.from(categoryMap.values());
        // Productos más usados - MEJORADO CON INFORMACIÓN COMPLETA
        const productUsage = new Map();
        for (const m of movements) {
            if (m.type === 'EXIT') {
                const id = m.productId;
                const current = productUsage.get(id) || {
                    productName: m.Product?.name || 'Producto desconocido',
                    totalExits: 0,
                    totalUsage: 0,
                    category: m.Product?.category || 'Sin categoría',
                    unit: m.Product?.unit || 'unidades'
                };
                current.totalExits += Number(m.quantity);
                current.totalUsage += Number(m.quantity); // Para compatibilidad
                productUsage.set(id, current);
            }
        }
        const mostUsedProducts = Array.from(productUsage.values())
            .filter(product => product.totalExits > 0) // Solo productos que han tenido salidas
            .sort((a, b) => (b.totalExits + b.totalUsage) - (a.totalExits + a.totalUsage))
            .slice(0, 10); // Incrementado a 10 productos
        // Alertas de bajo stock - ULTRA-OPTIMIZADO
        const lowStockAlerts = stockBySede
            .filter(s => Number(s.quantity) < 10)
            .map(s => ({
            name: s.Product?.name || 'Desconocido',
            quantity: Number(s.quantity),
            unitCost: Number(s.Product?.costPerUnit || 0),
            totalValue: Number(s.quantity) * Number(s.Product?.costPerUnit || 0),
            category: s.Product?.category || 'Sin categoría'
        }))
            .slice(0, 10); // Ultra-agresivo: solo 10 alertas
        // Procesar alertas de expiración - ULTRA-OPTIMIZADO
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const processedExpirationAlerts = expirationAlerts.map(alert => {
            const expiryDate = new Date(alert.expiryDate);
            const isExpired = expiryDate < now;
            const isExpiringSoon = expiryDate <= thirtyDaysFromNow && expiryDate >= now;
            return {
                ...alert,
                isExpired,
                isExpiringSoon,
                status: isExpired ? 'caducado' : isExpiringSoon ? 'próximo_a_caducar' : 'normal',
                daysUntilExpiry: isExpired
                    ? Math.floor((now.getTime() - expiryDate.getTime()) / (24 * 60 * 60 * 1000))
                    : Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            };
        }).slice(0, 15); // Ultra-agresivo: solo 15 alertas
        // Movimientos recientes - MEJORADO CON INFORMACIÓN COMPLETA
        const recentMovements = movements.slice(0, 10).map(movement => ({
            id: movement.id,
            type: movement.type,
            productName: movement.Product?.name || 'Producto desconocido',
            quantity: Number(movement.quantity),
            totalCost: Number(movement.totalCost),
            batchNumber: movement.batchNumber,
            date: movement.createdAt,
            category: movement.Product?.category || 'Sin categoría',
            unit: movement.Product?.unit || 'unidades'
        }));
        // Inventario inmovilizado - MEJORADO CON LÓGICA REAL
        const ninetyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
        console.log('🔍 DEBUG - Inventario Inmovilizado:', {
            ninetyDaysAgo: ninetyDaysAgo.toISOString(),
            totalStockItems: stockBySede.length,
            totalMovements: movements.length,
            sampleMovements: movements.slice(0, 3).map(m => ({
                productId: m.productId,
                createdAt: m.createdAt,
                isRecent: new Date(m.createdAt) > ninetyDaysAgo
            }))
        });
        const immobilizedInventory = stockBySede
            .filter(s => {
            const quantity = Number(s.quantity);
            if (quantity <= 0)
                return false;
            // Buscar si ha tenido movimientos recientes
            const hasRecentMovement = movements.some(m => m.productId === s.Product?.id &&
                new Date(m.createdAt) > ninetyDaysAgo);
            console.log(`🔍 DEBUG - Producto ${s.Product?.name}:`, {
                quantity,
                hasRecentMovement,
                productId: s.Product?.id,
                movementsForProduct: movements.filter(m => m.productId === s.Product?.id).length
            });
            return !hasRecentMovement; // Solo productos sin movimientos recientes
        })
            .map(s => {
            // Buscar el último movimiento de este producto
            const lastMovement = movements
                .filter(m => m.productId === s.Product?.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const lastMovementDate = lastMovement ? new Date(lastMovement.createdAt) : new Date(0);
            const daysWithoutMovement = Math.floor((Date.now() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
                productName: s.Product?.name || 'Producto desconocido',
                quantity: Number(s.quantity),
                value: Number(s.quantity) * Number(s.Product?.costPerUnit || 0),
                lastMovement: lastMovementDate,
                daysWithoutMovement,
                category: s.Product?.category || 'Sin categoría'
            };
        })
            .sort((a, b) => b.daysWithoutMovement - a.daysWithoutMovement) // Ordenar por días sin movimiento
            .slice(0, 10); // Incrementado a 10 productos
        const processingTime = performance.now() - processingStart;
        console.log(`⚙️ Backend - Procesamiento de datos completado en ${processingTime.toFixed(2)}ms`);
        // Construir respuesta optimizada
        const dashboardData = {
            inventory,
            totalInventoryValue,
            totalEnteredInventoryCost,
            totalUsedInventoryCost,
            inventoryByCategory,
            mostUsedProducts,
            lowStockAlerts,
            expirationAlerts: processedExpirationAlerts,
            recentMovements,
            immobilizedInventory
        };
        // Guardar en caché por 2 minutos para optimizar performance
        cache_1.cache.set(cacheKey, dashboardData, 2 * 60 * 1000);
        const totalTime = performance.now() - startTime;
        console.log(`✅ Backend - Dashboard generado y cacheado en ${totalTime.toFixed(2)}ms total`);
        res.json(dashboardData);
    }
    catch (error) {
        console.error('Error en dashboard/public:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
    }
});
// GET /consultorios-sedes - Obtener mapeo de consultorios a sedes DINÁMICAMENTE
router.get('/consultorios-sedes', async (req, res) => {
    try {
        console.log('🔍 Endpoint /consultorios-sedes llamado');
        // Obtener todas las sedes dinámicamente desde la base de datos
        const sedes = await prisma_1.default.sede.findMany({
            select: {
                id: true,
                name: true,
                consultorio_id: true
            }
        });
        console.log('🔍 Sedes obtenidas de BD:', sedes);
        // Crear mapeo dinámico - RELACIÓN REAL entre Consultorio y Sede
        const consultorioSedeMapping = {
            'todos': 'todos' // Para "todos los consultorios"
        };
        // Agregar mapeos dinámicos usando la relación real consultorio_id -> sede.id
        for (const sede of sedes) {
            if (sede.consultorio_id) {
                consultorioSedeMapping[sede.consultorio_id] = sede.id;
                console.log(`🔍 Mapeo agregado: ${sede.consultorio_id} -> ${sede.id}`);
            }
        }
        console.log('🔍 Mapeo consultorio-sede generado:', consultorioSedeMapping);
        res.json({ mapping: consultorioSedeMapping });
    }
    catch (error) {
        console.error('Error obteniendo mapeo consultorio-sede:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// GET /consultorios-sedes-public - Endpoint público para debug
router.get('/consultorios-sedes-public', async (req, res) => {
    try {
        console.log('🔍 Endpoint DEBUG /consultorios-sedes-debug llamado');
        // Obtener todas las sedes dinámicamente desde la base de datos
        const sedes = await prisma_1.default.sede.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                createdAt: true,
                updatedAt: true
            }
        });
        console.log('🔍 Sedes obtenidas de BD (sin consultorio_id):', sedes);
        // Crear mapeo temporal usando sedeId como consultorioId
        const consultorioSedeMapping = {
            'todos': 'todos'
        };
        // Mapeo temporal: usar sedeId como consultorioId
        for (const sede of sedes) {
            consultorioSedeMapping[sede.id] = sede.id;
            console.log(`🔍 Mapeo temporal agregado: ${sede.id} -> ${sede.id}`);
        }
        console.log('🔍 Mapeo consultorio-sede generado (temporal):', consultorioSedeMapping);
        res.json({
            mapping: consultorioSedeMapping,
            debug: {
                sedes: sedes,
                totalSedes: sedes.length,
                message: "Mapeo temporal usando sedeId como consultorioId"
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo mapeo consultorio-sede:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
