import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { performanceMonitor } from '../utils/performanceMonitor';
import { connectionLimiter } from '../middleware/connectionLimiter';
import { smartCache } from '../utils/smartCache';
import { getConnectionStats } from '../utils/databaseConfig';

// Endpoint para obtener métricas de performance
export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  const memoryStats = performanceMonitor.getMemoryStats();
  const recentMetrics = performanceMonitor.getRecentMetrics(10);
  const connectionStats = connectionLimiter.getStats();
  const cacheStats = smartCache.getStats();
  const dbStats = await getConnectionStats();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    memory: memoryStats,
    uptime: process.uptime(),
    connections: connectionStats,
    cache: cacheStats,
    database: dbStats,
    recentMetrics: recentMetrics.map(m => ({
      timestamp: m.timestamp,
      memoryUsed: Math.round(m.memoryUsage.heapUsed / 1024 / 1024), // MB
      slowQueries: m.slowQueries,
      errorCount: m.errorCount
    })),
    environment: process.env.NODE_ENV,
    status: {
      healthy: (memoryStats?.current || 0) < 500 && connectionStats.totalConnections < 80,
      warnings: [] as string[]
    }
  };

  // Agregar warnings si hay problemas
  if ((memoryStats?.current || 0) > 400) {
    metrics.status.warnings.push('Memoria alta');
  }
  if (connectionStats.totalConnections > 60) {
    metrics.status.warnings.push('Muchas conexiones activas');
  }
  if (cacheStats.hitRate < 50) {
    metrics.status.warnings.push('Cache hit rate bajo');
  }

  res.json(metrics);
});

// Endpoint para resetear contadores (solo en desarrollo)
export const resetMetrics = asyncHandler(async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Solo disponible en desarrollo' });
  }

  performanceMonitor.resetCounters();
  res.json({ message: 'Contadores de métricas reseteados' });
});
