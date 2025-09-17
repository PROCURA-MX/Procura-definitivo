#!/usr/bin/env node

// Script para monitorear el rendimiento de la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorPerformance() {
  console.log('🔍 Monitoreando rendimiento de la base de datos...\n');

  try {
    // 1. Verificar queries lentas
    console.log('📊 Queries más lentas:');
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        rows
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC 
      LIMIT 10
    `;
    
    console.table(slowQueries);

    // 2. Verificar uso de índices
    console.log('\n📈 Uso de índices:');
    const indexUsage = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC 
      LIMIT 10
    `;
    
    console.table(indexUsage);

    // 3. Verificar estadísticas de tablas
    console.log('\n📋 Estadísticas de tablas:');
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC 
      LIMIT 10
    `;
    
    console.table(tableStats);

    // 4. Verificar conexiones activas
    console.log('\n🔗 Conexiones activas:');
    const activeConnections = await prisma.$queryRaw`
      SELECT 
        count(*) as active_connections,
        state
      FROM pg_stat_activity 
      WHERE state IS NOT NULL 
      GROUP BY state
    `;
    
    console.table(activeConnections);

    // 5. Verificar tamaño de tablas
    console.log('\n💾 Tamaño de tablas:');
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
      LIMIT 10
    `;
    
    console.table(tableSizes);

    // 6. Verificar fragmentación de tablas
    console.log('\n🧹 Fragmentación de tablas:');
    const fragmentation = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_dead_tup,
        n_live_tup,
        CASE 
          WHEN n_live_tup > 0 THEN 
            ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2)
          ELSE 0 
        END as fragmentation_percent
      FROM pg_stat_user_tables 
      WHERE n_live_tup > 0
      ORDER BY fragmentation_percent DESC 
      LIMIT 10
    `;
    
    console.table(fragmentation);

    // 7. Recomendaciones
    console.log('\n💡 Recomendaciones:');
    
    // Verificar si hay tablas con mucha fragmentación
    const highFragmentation = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_stat_user_tables 
      WHERE n_live_tup > 1000 
      AND (n_dead_tup::float / n_live_tup::float) > 0.1
    `;
    
    if (highFragmentation.length > 0) {
      console.log('⚠️  Tablas con alta fragmentación detectadas:');
      highFragmentation.forEach(table => {
        console.log(`   - ${table.tablename}: Considerar VACUUM`);
      });
    }

    // Verificar queries sin uso de índices
    const noIndexQueries = await prisma.$queryRaw`
      SELECT query 
      FROM pg_stat_statements 
      WHERE mean_exec_time > 1000 
      AND query NOT LIKE '%INDEX%'
      LIMIT 5
    `;
    
    if (noIndexQueries.length > 0) {
      console.log('\n⚠️  Queries lentas sin uso de índices:');
      noIndexQueries.forEach(query => {
        console.log(`   - ${query.query.substring(0, 100)}...`);
      });
    }

    // Verificar tablas sin estadísticas actualizadas
    const outdatedStats = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_stat_user_tables 
      WHERE last_analyze IS NULL 
      OR last_analyze < NOW() - INTERVAL '7 days'
    `;
    
    if (outdatedStats.length > 0) {
      console.log('\n⚠️  Tablas con estadísticas desactualizadas:');
      outdatedStats.forEach(table => {
        console.log(`   - ${table.tablename}: Ejecutar ANALYZE`);
      });
    }

  } catch (error) {
    console.error('❌ Error al monitorear rendimiento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar monitoreo
monitorPerformance(); 