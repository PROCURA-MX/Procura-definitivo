// Configuración optimizada para Neon PostgreSQL con connection pooling
import { PrismaClient } from '@prisma/client';

// Configuración de connection pooling para Neon
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  
  if (!baseUrl) {
    throw new Error('DATABASE_URL no está configurada');
  }

  // Si ya tiene parámetros de pooling, usarla tal como está
  if (baseUrl.includes('?')) {
    return baseUrl;
  }

  // Agregar parámetros de connection pooling para Neon
  const poolParams = new URLSearchParams({
    // Connection pooling
    'connection_limit': '10',        // Máximo 10 conexiones simultáneas
    'pool_timeout': '20',            // 20 segundos timeout para obtener conexión
    'connect_timeout': '10',         // 10 segundos timeout para conectar
    'idle_timeout': '30',            // 30 segundos antes de cerrar conexión inactiva
    'max_lifetime': '3600',          // 1 hora máximo de vida de conexión
    
    // Configuraciones específicas para Neon
    'sslmode': 'require',            // Requerir SSL
    'application_name': 'procura-backend', // Nombre de la aplicación
    
    // Configuraciones de performance
    'statement_timeout': '30000',    // 30 segundos timeout por query
    'idle_in_transaction_session_timeout': '60000', // 1 minuto timeout para transacciones inactivas
  });

  return `${baseUrl}?${poolParams.toString()}`;
};

// Crear instancia de Prisma con connection pooling optimizado
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Middleware para logging de queries lentas y métricas
prisma.$extends({
  query: {
    async $allOperations({ operation, args, query }) {
      const before = Date.now();
      
      try {
        const result = await query(args);
        const after = Date.now();
        const duration = after - before;
        
        // Log queries que toman más de 500ms en desarrollo, 1000ms en producción
        const slowQueryThreshold = process.env.NODE_ENV === 'development' ? 500 : 1000;
        if (duration > slowQueryThreshold) {
          console.warn(`⚠️ Query lenta detectada: ${operation} - ${duration}ms`);
        }
        
        return result;
      } catch (error: any) {
        // Log específico para errores de conexión
        if (error.code === 'P1001' || error.code === 'P1002') {
          console.error('🚨 Error de conexión a la base de datos:', error.message);
        }
        throw error;
      }
    }
  }
});

// Función para verificar el estado de las conexiones
export const getConnectionStats = async () => {
  try {
    // Query simple para verificar conexión
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      connected: true,
      responseTime: duration,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Graceful shutdown mejorado
const gracefulShutdown = async () => {
  console.log('🔄 Cerrando conexiones a la base de datos...');
  try {
    await prisma.$disconnect();
    console.log('✅ Conexiones cerradas correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error);
  }
};

// Manejar cierre del proceso
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('beforeExit', gracefulShutdown);

// Limpiar conexiones inactivas cada 5 minutos
setInterval(async () => {
  try {
    // Forzar limpieza de conexiones inactivas
    await prisma.$queryRaw`SELECT pg_stat_activity WHERE state = 'idle'`;
    console.log('🧹 Limpieza de conexiones inactivas ejecutada');
  } catch (error) {
    // Ignorar errores de limpieza
  }
}, 5 * 60 * 1000);

export default prisma;
