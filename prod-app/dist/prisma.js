"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// Configuración optimizada para producción multi-tenant
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    // Configuración del pool de conexiones optimizada para producción
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Configuración de conexiones para evitar saturación
    // Nota: La configuración del pool se maneja a nivel de DATABASE_URL
});
// Middleware para logging de queries lentas y métricas
prisma.$extends({
    query: {
        async $allOperations({ operation, args, query }) {
            const before = Date.now();
            const result = await query(args);
            const after = Date.now();
            const duration = after - before;
            // Log queries que toman más de 500ms en desarrollo, 1000ms en producción
            const slowQueryThreshold = process.env.NODE_ENV === 'development' ? 500 : 1000;
            if (duration > slowQueryThreshold) {
                console.warn(`⚠️ Query lenta detectada: ${operation} - ${duration}ms`);
            }
            // Log de métricas en producción
            if (process.env.NODE_ENV === 'production') {
                console.log(`📊 Query: ${operation} - ${duration}ms`);
            }
            return result;
        }
    }
});
// Middleware para manejo de errores de conexión
prisma.$extends({
    query: {
        async $allOperations({ operation, args, query }) {
            try {
                return await query(args);
            }
            catch (error) {
                // Log específico para errores de conexión
                if (error.code === 'P1001' || error.code === 'P1002') {
                    console.error('🚨 Error de conexión a la base de datos:', error.message);
                }
                throw error;
            }
        }
    }
});
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
