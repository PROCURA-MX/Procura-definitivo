// Sistema de cache inteligente para prevenir saturación
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Máximo 1000 entradas en cache
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar cache cada 2 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  // Obtener datos del cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Actualizar estadísticas
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  // Guardar datos en cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);

    // Si el cache está lleno, eliminar la entrada menos usada
    if (this.cache.size > this.maxSize) {
      this.evictLeastUsed();
    }
  }

  // Eliminar entrada del cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Limpiar cache expirado
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Eliminar la entrada menos usada
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits || 
          (entry.hits === leastHits && entry.lastAccessed < oldestAccess)) {
        leastUsedKey = key;
        leastHits = entry.hits;
        oldestAccess = entry.lastAccessed;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  // Obtener estadísticas del cache
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      hitRate: totalHits > 0 ? Math.round((totalHits / (totalHits + this.cache.size)) * 100) : 0
    };
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Destruir el cache
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Instancia global del cache
export const smartCache = new SmartCache();

// Middleware para cachear respuestas de API
export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: any, res: any, next: any) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Crear clave única para la request
    const cacheKey = `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    
    // Intentar obtener del cache
    const cachedData = smartCache.get(cacheKey);
    if (cachedData) {
      console.log(`📦 Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Interceptar la respuesta para cachearla
    const originalSend = res.json;
    res.json = function(data: any) {
      // Solo cachear respuestas exitosas
      if (res.statusCode === 200) {
        console.log(`📦 Cache SET: ${cacheKey}`);
        smartCache.set(cacheKey, data, ttl);
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

// Función para invalidar cache por patrón
export function invalidateCache(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of smartCache['cache'].keys()) {
    if (regex.test(key)) {
      smartCache.delete(key);
    }
  }
}
