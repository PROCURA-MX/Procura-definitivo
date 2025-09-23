#!/bin/bash

# =====================================================
# SCRIPT DE OPTIMIZACIÓN DE PERFORMANCE
# =====================================================
# Este script aplica optimizaciones SEGURAS que:
# ✅ NO modifican funcionalidad existente
# ✅ NO cambian datos
# ✅ Solo agregan índices y optimizaciones
# ✅ Son reversibles si algo sale mal
# =====================================================

echo "🚀 Iniciando optimizaciones de performance..."
echo "📋 Verificando conexión a la base de datos..."

# Verificar que la base de datos esté disponible
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql no está instalado"
    exit 1
fi

# Obtener la URL de la base de datos desde el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: Archivo .env no encontrado"
    exit 1
fi

# Extraer DATABASE_URL del archivo .env
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no encontrado en .env"
    exit 1
fi

echo "✅ Conexión a base de datos configurada"
echo "🔍 Aplicando optimizaciones..."

# 1. APLICAR OPTIMIZACIONES DE ÍNDICES
echo "📊 Aplicando optimizaciones de índices..."
psql "$DATABASE_URL" -f optimize-performance.sql

if [ $? -eq 0 ]; then
    echo "✅ Optimizaciones de índices aplicadas correctamente"
else
    echo "❌ Error al aplicar optimizaciones de índices"
    exit 1
fi

# 2. APLICAR OPTIMIZACIONES DE CONFIGURACIÓN
echo "⚙️ Aplicando optimizaciones de configuración..."
psql "$DATABASE_URL" -f prisma/optimize-migrations.sql

if [ $? -eq 0 ]; then
    echo "✅ Optimizaciones de configuración aplicadas correctamente"
else
    echo "❌ Error al aplicar optimizaciones de configuración"
    exit 1
fi

# 3. VERIFICAR OPTIMIZACIONES
echo "🔍 Verificando optimizaciones aplicadas..."

# Verificar índices creados
echo "📋 Índices creados:"
psql "$DATABASE_URL" -c "
SELECT 
    tablename,
    COUNT(*) as indices_count
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;
"

# Verificar configuración aplicada
echo "⚙️ Configuración aplicada:"
psql "$DATABASE_URL" -c "
SELECT 
    name,
    setting,
    unit
FROM pg_settings 
WHERE name IN (
    'checkpoint_timeout',
    'wal_buffers',
    'shared_buffers',
    'max_connections',
    'random_page_cost'
)
ORDER BY name;
"

echo "✅ Optimizaciones completadas exitosamente!"
echo ""
echo "📊 RESUMEN DE OPTIMIZACIONES:"
echo "   • Índices agregados para queries más rápidas"
echo "   • Configuración de PostgreSQL optimizada"
echo "   • Migraciones de Prisma más rápidas"
echo ""
echo "🔄 Para aplicar los cambios, reinicia el servidor:"
echo "   npm run dev"
echo ""
echo "📈 Resultados esperados:"
echo "   • Queries de cobros: 1.6s → ~200ms"
echo "   • Migraciones Prisma: 1.3s → ~500ms"
echo "   • Mejor performance general"
