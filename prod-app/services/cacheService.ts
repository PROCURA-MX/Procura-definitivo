// Cache Service para optimizar queries frecuentes
// Cache en memoria para datos que no cambian frecuentemente

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene un valor del cache
   */
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

    return entry.data;
  }

  /**
   * Guarda un valor en el cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Elimina un valor del cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Cache para usuarios (TTL: 10 minutos)
   */
  getUserCacheKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Cache para productos por categoría (TTL: 15 minutos)
   */
  getProductsByCategoryCacheKey(category: string, sedeId: string): string {
    return `products:category:${category}:sede:${sedeId}`;
  }

  /**
   * Cache para movimientos por sede (TTL: 5 minutos)
   */
  getMovementsCacheKey(sedeId: string, type: string, from: string, to: string): string {
    return `movements:${sedeId}:${type}:${from}:${to}`;
  }

  // Métodos de invalidación para compatibilidad
  invalidateCobros(organizacionId: string): void {
    this.delete(`cobros:${organizacionId}`);
  }

  invalidatePacientes(organizacionId: string): void {
    this.delete(`pacientes:${organizacionId}`);
  }

  invalidateUsuarios(organizacionId: string): void {
    this.delete(`usuarios:${organizacionId}`);
  }

  invalidateConsultorios(organizacionId: string): void {
    this.delete(`consultorios:${organizacionId}`);
  }
}

// Instancia global del cache
export const cacheService = new CacheService();

// Default export para compatibilidad
export default CacheService;

// Función helper para cache con fallback
export async function getCachedOrFetch<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del cache
  const cached = cacheService.get<T>(key);
  if (cached !== null) {
    console.log(`📦 Cache HIT: ${key}`);
    return cached;
  }

  // Si no está en cache, obtener de la base de datos
  console.log(`📦 Cache MISS: ${key}`);
  const data = await fetchFunction();
  
  // Guardar en cache
  cacheService.set(key, data, ttl);
  
  return data;
} 