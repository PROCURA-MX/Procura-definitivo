import { Request, Response, NextFunction } from 'express';

// Middleware para monitorear performance de queries
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = performance.now();
  
  // Interceptar el método json para medir tiempo de respuesta
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = performance.now() - startTime;
    
    // Log de performance solo para queries lentas
    if (responseTime > 500) {
      console.warn(`⚠️ Query lenta detectada: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
    }
    
    // Log de performance para todas las queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

// Middleware para agregar headers de performance
export function performanceHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Response-Time', '0ms');
  res.setHeader('X-Cache-Status', 'MISS');
  
  next();
}

// Función para medir tiempo de ejecución de funciones
export async function measureExecutionTime<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const executionTime = performance.now() - startTime;
    
    if (executionTime > 100) {
      console.warn(`⚠️ Función lenta: ${label} - ${executionTime.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const executionTime = performance.now() - startTime;
    console.error(`❌ Error en ${label} después de ${executionTime.toFixed(2)}ms:`, error);
    throw error;
  }
}
