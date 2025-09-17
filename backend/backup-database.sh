#!/bin/bash

# Script de respaldo automático de la base de datos Neon
# Autor: Sistema ProCura
# Fecha: $(date)

# Configuración
BACKUP_DIR="/Users/paul/Bravo/modulosjuntos/backups"
DATABASE_URL="postgresql://neondb_owner:npg_gdL38fTWHYsa@ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="neon_backup_${TIMESTAMP}.sql"

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

# Función de limpieza de respaldos antiguos (mantener solo los últimos 7 días)
cleanup_old_backups() {
    log "Limpiando respaldos antiguos..."
    find "$BACKUP_DIR" -name "neon_backup_*.sql" -mtime +7 -delete
    log "Limpieza completada"
}

# Función principal de respaldo
backup_database() {
    log "Iniciando respaldo de la base de datos..."
    
    # Extraer componentes de la URL de la base de datos
    DB_HOST="ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech"
    DB_NAME="neondb"
    DB_USER="neondb_owner"
    DB_PASS="npg_gdL38fTWHYsa"
    
    # Crear respaldo usando pg_dump
    log "Ejecutando pg_dump..."
    
    if PGPASSWORD="$DB_PASS" PGSSLMODE=require pg_dump \
        --host="$DB_HOST" \
        --port=5432 \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --no-owner \
        --no-privileges \
        --schema=public \
        --file="$BACKUP_DIR/$BACKUP_FILE"; then
        
        log "✅ Respaldo completado exitosamente: $BACKUP_FILE"
        
        # Comprimir el archivo de respaldo
        log "Comprimiendo respaldo..."
        gzip "$BACKUP_DIR/$BACKUP_FILE"
        log "✅ Respaldo comprimido: $BACKUP_FILE.gz"
        
        # Mostrar información del archivo
        BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
        log "📊 Tamaño del respaldo: $BACKUP_SIZE"
        
        # Verificar integridad del respaldo
        log "Verificando integridad del respaldo..."
        if gzip -t "$BACKUP_DIR/$BACKUP_FILE.gz"; then
            log "✅ Integridad del respaldo verificada"
        else
            log "❌ Error: El archivo de respaldo está corrupto"
            exit 1
        fi
        
        return 0
    else
        log "❌ Error al crear el respaldo"
        return 1
    fi
}

# Función de notificación (opcional)
notify_backup_status() {
    local status=$1
    local message=$2
    
    # Aquí puedes agregar notificaciones por email, Slack, etc.
    log "Notificación: $message"
    
    # Ejemplo: enviar notificación por email (requiere configuración)
    # echo "$message" | mail -s "Respaldo DB ProCura - $status" tu-email@ejemplo.com
}

# Función principal
main() {
    log "=== INICIO DE RESPALDO AUTOMÁTICO ==="
    
    # Verificar si pg_dump está disponible
    if ! command -v pg_dump &> /dev/null; then
        log "❌ Error: pg_dump no está instalado"
        log "Instala PostgreSQL client: brew install postgresql"
        exit 1
    fi
    
    # Crear respaldo
    if backup_database; then
        log "✅ Respaldo completado exitosamente"
        notify_backup_status "EXITOSO" "Respaldo de base de datos completado: $BACKUP_FILE.gz"
    else
        log "❌ Error en el proceso de respaldo"
        notify_backup_status "FALLIDO" "Error en el respaldo de base de datos"
        exit 1
    fi
    
    # Limpiar respaldos antiguos
    cleanup_old_backups
    
    log "=== FIN DE RESPALDO AUTOMÁTICO ==="
}

# Ejecutar función principal
main "$@"
