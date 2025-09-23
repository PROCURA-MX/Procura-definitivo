#!/bin/bash

# Script para configurar respaldos automáticos de la base de datos
# Autor: Sistema ProCura

BACKUP_SCRIPT="/Users/paul/Bravo/modulosjuntos/backend/backup-database.sh"
CRON_LOG="/Users/paul/Bravo/modulosjuntos/backups/cron.log"

echo "🔧 Configurando respaldos automáticos para ProCura..."

# Verificar que el script de respaldo existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: No se encontró el script de respaldo en $BACKUP_SCRIPT"
    exit 1
fi

# Crear directorio de respaldos
mkdir -p "/Users/paul/Bravo/modulosjuntos/backups"

# Verificar si pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump no está instalado"
    echo "📦 Instalando PostgreSQL client..."
    brew install postgresql
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar PostgreSQL client"
        exit 1
    fi
fi

echo "✅ PostgreSQL client verificado"

# Función para agregar entrada al cron
add_cron_job() {
    local frequency=$1
    local cron_expression=$2
    local description=$3
    
    echo "📅 Configurando respaldo $frequency..."
    
    # Crear entrada temporal del cron
    (crontab -l 2>/dev/null; echo "$cron_expression $BACKUP_SCRIPT >> $CRON_LOG 2>&1") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Respaldo $frequency configurado exitosamente"
    else
        echo "❌ Error al configurar respaldo $frequency"
        return 1
    fi
}

# Configurar diferentes frecuencias de respaldo
echo ""
echo "🔄 Configurando respaldos automáticos..."

# Respaldo diario a las 2:00 AM
add_cron_job "diario" "0 2 * * *" "Respaldo diario a las 2:00 AM"

# Respaldo semanal los domingos a las 3:00 AM
add_cron_job "semanal" "0 3 * * 0" "Respaldo semanal los domingos a las 3:00 AM"

# Respaldo mensual el primer día del mes a las 4:00 AM
add_cron_job "mensual" "0 4 1 * *" "Respaldo mensual el primer día del mes a las 4:00 AM"

echo ""
echo "📋 Configuración de respaldos:"
echo "   • Diario: 2:00 AM todos los días"
echo "   • Semanal: 3:00 AM los domingos"
echo "   • Mensual: 4:00 AM el primer día del mes"
echo ""
echo "📁 Directorio de respaldos: /Users/paul/Bravo/modulosjuntos/backups"
echo "📝 Log de cron: $CRON_LOG"
echo ""

# Mostrar cron jobs actuales
echo "📋 Cron jobs configurados:"
crontab -l | grep -E "(backup-database|neon)" || echo "   No se encontraron cron jobs de respaldo"

echo ""
echo "🧪 Probando script de respaldo..."
if $BACKUP_SCRIPT; then
    echo "✅ Script de respaldo funciona correctamente"
else
    echo "❌ Error en el script de respaldo"
    echo "Revisa los logs en: $CRON_LOG"
fi

echo ""
echo "📚 Comandos útiles:"
echo "   • Ver cron jobs: crontab -l"
echo "   • Editar cron jobs: crontab -e"
echo "   • Ver logs: tail -f $CRON_LOG"
echo "   • Respaldo manual: $BACKUP_SCRIPT"
echo "   • Listar respaldos: ls -la /Users/paul/Bravo/modulosjuntos/backups/"
echo ""
echo "🎉 Configuración de respaldos automáticos completada!"
