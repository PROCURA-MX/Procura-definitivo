"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
exports.getCacheKey = getCacheKey;
exports.invalidateCacheByPrefix = invalidateCacheByPrefix;
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto
    }
    set(key, data, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const isExpired = Date.now() - entry.timestamp > entry.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    // Limpiar entradas expiradas
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
    // Obtener estadísticas del cache
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
// Instancia global del cache
exports.cache = new SimpleCache();
// Limpiar cache expirado cada 10 minutos
setInterval(() => {
    exports.cache.cleanup();
}, 10 * 60 * 1000);
// Funciones helper para cache
function getCacheKey(prefix, params) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
    return `${prefix}:${sortedParams}`;
}
function invalidateCacheByPrefix(prefix) {
    const stats = exports.cache.getStats();
    for (const key of stats.keys) {
        if (key.startsWith(prefix)) {
            exports.cache.delete(key);
        }
    }
}
