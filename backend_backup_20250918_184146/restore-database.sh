#!/bin/bash

# Script para restaurar respaldos de la base de datos Neon
# Autor: Sistema ProCura
# Uso: ./restore-database.sh [archivo_respaldo]

# Configuración
BACKUP_DIR="/Users/paul/Bravo/modulosjuntos/backups"
DATABASE_URL="postgresql://neondb_owner:npg_gdL38fTWHYsa@ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [opciones] [archivo_respaldo]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help     Mostrar esta ayuda"
    echo "  -l, --list     Listar respaldos disponibles"
    echo "  -t, --test     Modo de prueba (no ejecuta la restauración)"
    echo ""
    echo "Ejemplos:"
    echo "  $0 neon_backup_20250817_120000.sql.gz"
    echo "  $0 -l"
    echo "  $0 -t neon_backup_20250817_120000.sql.gz"
    echo ""
}

# Función para listar respaldos disponibles
list_backups() {
    echo "📋 Respaldos disponibles en $BACKUP_DIR:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ Directorio de respaldos no existe: $BACKUP_DIR"
        return 1
    fi
    
    local backups=($(ls -t "$BACKUP_DIR"/neon_backup_*.sql.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ No se encontraron respaldos"
        return 1
    fi
    
    for backup in "${backups[@]}"; do
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(echo "$filename" | sed 's/neon_backup_\([0-9]\{8\}\)_\([0-9]\{6\}\)\.sql\.gz/\1_\2/')
        local formatted_date=$(echo "$date" | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
        
        echo "📁 $filename"
        echo "   📅 Fecha: $formatted_date"
        echo "   📊 Tamaño: $size"
        echo ""
    done
}

# Función para verificar archivo de respaldo
verify_backup_file() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Error: El archivo de respaldo no existe: $backup_file"
        return 1
    fi
    
    if [[ "$backup_file" != *.gz ]]; then
        echo "❌ Error: El archivo debe estar comprimido (.gz): $backup_file"
        return 1
    fi
    
    echo "🔍 Verificando integridad del archivo de respaldo..."
    if ! gzip -t "$backup_file"; then
        echo "❌ Error: El archivo de respaldo está corrupto"
        return 1
    fi
    
    echo "✅ Archivo de respaldo verificado"
    return 0
}

# Función para confirmar restauración
confirm_restore() {
    local backup_file=$1
    
    echo ""
    echo "⚠️  ADVERTENCIA: Esta operación sobrescribirá la base de datos actual"
    echo "📁 Archivo de respaldo: $backup_file"
    echo ""
    echo "¿Estás seguro de que quieres continuar? (sí/no): "
    read -r response
    
    if [[ "$response" =~ ^[Ss][IiÍí]$ ]]; then
        return 0
    else
        echo "❌ Restauración cancelada"
        return 1
    fi
}

# Función principal de restauración
restore_database() {
    local backup_file=$1
    local test_mode=$2
    
    log "Iniciando restauración de la base de datos..."
    
    # Extraer componentes de la URL de la base de datos
    DB_HOST="ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech"
    DB_NAME="neondb"
    DB_USER="neondb_owner"
    DB_PASS="npg_gdL38fTWHYsa"
    
    if [ "$test_mode" = "true" ]; then
        log "🧪 MODO PRUEBA: No se ejecutará la restauración real"
        log "Comando que se ejecutaría:"
        log "gunzip -c '$backup_file' | PGPASSWORD='$DB_PASS' psql --host='$DB_HOST' --port=5432 --username='$DB_USER' --dbname='$DB_NAME' --sslmode=require"
        return 0
    fi
    
    log "🔄 Restaurando base de datos..."
    
    # Crear respaldo de la base de datos actual antes de restaurar
    local current_backup="current_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    log "📦 Creando respaldo de la base de datos actual antes de restaurar..."
    
    if PGPASSWORD="$DB_PASS" pg_dump \
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
        --file="$BACKUP_DIR/$current_backup" \
        --sslmode=require; then
        
        gzip "$BACKUP_DIR/$current_backup"
        log "✅ Respaldo de seguridad creado: $current_backup.gz"
    else
        log "⚠️  No se pudo crear respaldo de seguridad, continuando..."
    fi
    
    # Restaurar desde el archivo de respaldo
    log "🔄 Ejecutando restauración..."
    
    if gunzip -c "$backup_file" | PGPASSWORD="$DB_PASS" psql \
        --host="$DB_HOST" \
        --port=5432 \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --sslmode=require \
        --verbose; then
        
        log "✅ Restauración completada exitosamente"
        return 0
    else
        log "❌ Error en la restauración"
        return 1
    fi
}

# Función principal
main() {
    local test_mode=false
    local backup_file=""
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                list_backups
                exit 0
                ;;
            -t|--test)
                test_mode=true
                shift
                ;;
            -*)
                echo "❌ Opción desconocida: $1"
                show_help
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # Si no se especificó archivo, mostrar ayuda
    if [ -z "$backup_file" ]; then
        echo "❌ Error: Debes especificar un archivo de respaldo"
        echo ""
        show_help
        exit 1
    fi
    
    # Si el archivo no tiene ruta completa, asumir que está en el directorio de respaldos
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/$backup_file"
    fi
    
    log "=== INICIO DE RESTAURACIÓN ==="
    
    # Verificar si psql está disponible
    if ! command -v psql &> /dev/null; then
        log "❌ Error: psql no está instalado"
        log "Instala PostgreSQL client: brew install postgresql"
        exit 1
    fi
    
    # Verificar archivo de respaldo
    if ! verify_backup_file "$backup_file"; then
        exit 1
    fi
    
    # Confirmar restauración (solo si no es modo prueba)
    if [ "$test_mode" = "false" ]; then
        if ! confirm_restore "$backup_file"; then
            exit 1
        fi
    fi
    
    # Ejecutar restauración
    if restore_database "$backup_file" "$test_mode"; then
        log "✅ Restauración completada exitosamente"
        if [ "$test_mode" = "false" ]; then
            echo ""
            echo "🎉 ¡Restauración completada!"
            echo "📁 Respaldo de seguridad: $BACKUP_DIR/$current_backup.gz"
        fi
    else
        log "❌ Error en el proceso de restauración"
        exit 1
    fi
    
    log "=== FIN DE RESTAURACIÓN ==="
}

# Ejecutar función principal
main "$@"
