"use strict";
// Cache Service para optimizar queries frecuentes
// Cache en memoria para datos que no cambian frecuentemente
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
exports.getCachedOrFetch = getCachedOrFetch;
class CacheService {
    constructor() {
        this.cache = new Map();
        this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
    }
    /**
     * Obtiene un valor del cache
     */
    get(key) {
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
    set(key, data, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
     * Elimina un valor del cache
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Limpia todo el cache
     */
    clear() {
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
    getUserCacheKey(userId) {
        return `user:${userId}`;
    }
    /**
     * Cache para productos por categoría (TTL: 15 minutos)
     */
    getProductsByCategoryCacheKey(category, sedeId) {
        return `products:category:${category}:sede:${sedeId}`;
    }
    /**
     * Cache para movimientos por sede (TTL: 5 minutos)
     */
    getMovementsCacheKey(sedeId, type, from, to) {
        return `movements:${sedeId}:${type}:${from}:${to}`;
    }
    // Métodos de invalidación para compatibilidad
    invalidateCobros(organizacionId) {
        this.delete(`cobros:${organizacionId}`);
    }
    invalidatePacientes(organizacionId) {
        this.delete(`pacientes:${organizacionId}`);
    }
    invalidateUsuarios(organizacionId) {
        this.delete(`usuarios:${organizacionId}`);
    }
    invalidateConsultorios(organizacionId) {
        this.delete(`consultorios:${organizacionId}`);
    }
}
// Instancia global del cache
exports.cacheService = new CacheService();
// Default export para compatibilidad
exports.default = CacheService;
// Función helper para cache con fallback
async function getCachedOrFetch(key, fetchFunction, ttl) {
    // Intentar obtener del cache
    const cached = exports.cacheService.get(key);
    if (cached !== null) {
        console.log(`📦 Cache HIT: ${key}`);
        return cached;
    }
    // Si no está en cache, obtener de la base de datos
    console.log(`📦 Cache MISS: ${key}`);
    const data = await fetchFunction();
    // Guardar en cache
    exports.cacheService.set(key, data, ttl);
    return data;
}
