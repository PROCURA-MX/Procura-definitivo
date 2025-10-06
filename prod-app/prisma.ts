// Re-exportar la configuración optimizada de databaseConfig
export { default as prisma, getConnectionStats } from './utils/databaseConfig';

// Exportación por defecto para compatibilidad
export { default } from './utils/databaseConfig'; 