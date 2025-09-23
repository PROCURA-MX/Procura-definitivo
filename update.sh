#!/bin/bash

# ========================================
# SCRIPT DE ACTUALIZACIÓN PARA MANTENIMIENTO
# ========================================

set -e

# Configuración
APP_DIR="/var/www/procura-cobros"
BACKUP_DIR="/var/backups/procura-cobros"
LOG_FILE="/var/log/procura-cobros/update.log"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  --hotfix     Aplicar hotfix (sin downtime)"
    echo "  --feature    Aplicar nueva funcionalidad"
    echo "  --rollback   Revertir a versión anterior"
    echo "  --backup     Solo crear backup"
    echo "  --status     Mostrar estado actual"
    echo "  --logs       Mostrar logs recientes"
    echo "  --help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 --hotfix     # Aplicar corrección rápida"
    echo "  $0 --feature    # Aplicar nueva funcionalidad"
    echo "  $0 --rollback   # Revertir cambios"
}

# Función para crear backup
create_backup() {
    local backup_type=$1
    local backup_date=$(date +%Y%m%d_%H%M%S)
    
    log "💾 Creando backup ($backup_type)..."
    mkdir -p $BACKUP_DIR
    
    # Backup de base de datos
    if docker ps | grep -q procura-postgres; then
        docker exec procura-postgres pg_dump -U procura_user procura_cobros_prod > $BACKUP_DIR/db_${backup_type}_${backup_date}.sql
        log "✅ Backup de BD: db_${backup_type}_${backup_date}.sql"
    fi
    
    # Backup de archivos
    if [ -d "$APP_DIR/uploads" ]; then
        tar -czf $BACKUP_DIR/files_${backup_type}_${backup_date}.tar.gz -C $APP_DIR uploads
        log "✅ Backup de archivos: files_${backup_type}_${backup_date}.tar.gz"
    fi
    
    # Backup de configuración
    cp $APP_DIR/.env $BACKUP_DIR/env_${backup_type}_${backup_date}.backup
    log "✅ Backup de configuración: env_${backup_type}_${backup_date}.backup"
    
    echo $backup_date
}

# Función para aplicar hotfix
apply_hotfix() {
    log "🔧 Aplicando hotfix..."
    
    # Crear backup
    backup_date=$(create_backup "hotfix")
    
    # Actualizar código
    cd $APP_DIR
    git fetch origin
    git checkout main
    git pull origin main
    
    # Reconstruir solo el backend si es necesario
    if git diff HEAD~1 --name-only | grep -E "(backend/|package.json)"; then
        log "🔨 Reconstruyendo backend..."
        docker-compose -f docker-compose.prod.yml build backend
        docker-compose -f docker-compose.prod.yml up -d backend
    fi
    
    # Reconstruir frontend si es necesario
    if git diff HEAD~1 --name-only | grep -E "(frontend/|package.json)"; then
        log "🔨 Reconstruyendo frontend..."
        docker-compose -f docker-compose.prod.yml build frontend
        docker-compose -f docker-compose.prod.yml up -d frontend
    fi
    
    # Ejecutar migraciones si es necesario
    if git diff HEAD~1 --name-only | grep -E "(prisma/|migrations)"; then
        log "🗄️ Ejecutando migraciones..."
        docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    fi
    
    # Verificar salud
    sleep 10
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log "✅ Hotfix aplicado exitosamente"
    else
        error "❌ Error aplicando hotfix"
    fi
}

# Función para aplicar nueva funcionalidad
apply_feature() {
    log "🚀 Aplicando nueva funcionalidad..."
    
    # Crear backup
    backup_date=$(create_backup "feature")
    
    # Detener servicios
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down
    
    # Actualizar código
    git fetch origin
    git checkout main
    git pull origin main
    
    # Reconstruir todo
    log "🔨 Reconstruyendo servicios..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Ejecutar migraciones
    log "🗄️ Ejecutando migraciones..."
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 10
    docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    
    # Iniciar servicios
    log "🚀 Iniciando servicios..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Verificar salud
    sleep 30
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log "✅ Nueva funcionalidad aplicada exitosamente"
    else
        error "❌ Error aplicando nueva funcionalidad"
    fi
}

# Función para rollback
rollback() {
    log "⏪ Realizando rollback..."
    
    # Listar backups disponibles
    echo "Backups disponibles:"
    ls -la $BACKUP_DIR/*.backup | tail -10
    
    read -p "Ingresa la fecha del backup a restaurar (YYYYMMDD_HHMMSS): " backup_date
    
    if [ ! -f "$BACKUP_DIR/env_backup_${backup_date}.backup" ]; then
        error "Backup no encontrado: $backup_date"
    fi
    
    # Detener servicios
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurar configuración
    cp $BACKUP_DIR/env_backup_${backup_date}.backup $APP_DIR/.env
    
    # Restaurar base de datos
    if [ -f "$BACKUP_DIR/db_backup_${backup_date}.sql" ]; then
        log "🗄️ Restaurando base de datos..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
        docker exec -i procura-postgres psql -U procura_user -d procura_cobros_prod < $BACKUP_DIR/db_backup_${backup_date}.sql
    fi
    
    # Restaurar archivos
    if [ -f "$BACKUP_DIR/files_backup_${backup_date}.tar.gz" ]; then
        log "📁 Restaurando archivos..."
        tar -xzf $BACKUP_DIR/files_backup_${backup_date}.tar.gz -C $APP_DIR
    fi
    
    # Iniciar servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Rollback completado"
}

# Función para mostrar estado
show_status() {
    log "📊 Estado actual del sistema:"
    
    echo ""
    echo "🐳 Contenedores Docker:"
    docker-compose -f $APP_DIR/docker-compose.prod.yml ps
    
    echo ""
    echo "💾 Uso de disco:"
    df -h
    
    echo ""
    echo "🧠 Uso de memoria:"
    free -h
    
    echo ""
    echo "🌐 Servicios web:"
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ Backend: OK"
    else
        echo "❌ Backend: ERROR"
    fi
    
    if curl -f http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend: OK"
    else
        echo "❌ Frontend: ERROR"
    fi
    
    echo ""
    echo "📋 Últimos backups:"
    ls -la $BACKUP_DIR/*.backup | tail -5
}

# Función para mostrar logs
show_logs() {
    log "📋 Mostrando logs recientes..."
    
    echo ""
    echo "🔧 Logs del backend:"
    docker-compose -f $APP_DIR/docker-compose.prod.yml logs --tail=20 backend
    
    echo ""
    echo "🌐 Logs de Nginx:"
    tail -20 /var/log/nginx/error.log
}

# Procesar argumentos
case "${1:-}" in
    --hotfix)
        apply_hotfix
        ;;
    --feature)
        apply_feature
        ;;
    --rollback)
        rollback
        ;;
    --backup)
        create_backup "manual"
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --help)
        show_help
        ;;
    *)
        echo "Opción no válida. Usa --help para ver las opciones disponibles."
        exit 1
        ;;
esac



# ========================================
# SCRIPT DE ACTUALIZACIÓN PARA MANTENIMIENTO
# ========================================

set -e

# Configuración
APP_DIR="/var/www/procura-cobros"
BACKUP_DIR="/var/backups/procura-cobros"
LOG_FILE="/var/log/procura-cobros/update.log"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  --hotfix     Aplicar hotfix (sin downtime)"
    echo "  --feature    Aplicar nueva funcionalidad"
    echo "  --rollback   Revertir a versión anterior"
    echo "  --backup     Solo crear backup"
    echo "  --status     Mostrar estado actual"
    echo "  --logs       Mostrar logs recientes"
    echo "  --help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 --hotfix     # Aplicar corrección rápida"
    echo "  $0 --feature    # Aplicar nueva funcionalidad"
    echo "  $0 --rollback   # Revertir cambios"
}

# Función para crear backup
create_backup() {
    local backup_type=$1
    local backup_date=$(date +%Y%m%d_%H%M%S)
    
    log "💾 Creando backup ($backup_type)..."
    mkdir -p $BACKUP_DIR
    
    # Backup de base de datos
    if docker ps | grep -q procura-postgres; then
        docker exec procura-postgres pg_dump -U procura_user procura_cobros_prod > $BACKUP_DIR/db_${backup_type}_${backup_date}.sql
        log "✅ Backup de BD: db_${backup_type}_${backup_date}.sql"
    fi
    
    # Backup de archivos
    if [ -d "$APP_DIR/uploads" ]; then
        tar -czf $BACKUP_DIR/files_${backup_type}_${backup_date}.tar.gz -C $APP_DIR uploads
        log "✅ Backup de archivos: files_${backup_type}_${backup_date}.tar.gz"
    fi
    
    # Backup de configuración
    cp $APP_DIR/.env $BACKUP_DIR/env_${backup_type}_${backup_date}.backup
    log "✅ Backup de configuración: env_${backup_type}_${backup_date}.backup"
    
    echo $backup_date
}

# Función para aplicar hotfix
apply_hotfix() {
    log "🔧 Aplicando hotfix..."
    
    # Crear backup
    backup_date=$(create_backup "hotfix")
    
    # Actualizar código
    cd $APP_DIR
    git fetch origin
    git checkout main
    git pull origin main
    
    # Reconstruir solo el backend si es necesario
    if git diff HEAD~1 --name-only | grep -E "(backend/|package.json)"; then
        log "🔨 Reconstruyendo backend..."
        docker-compose -f docker-compose.prod.yml build backend
        docker-compose -f docker-compose.prod.yml up -d backend
    fi
    
    # Reconstruir frontend si es necesario
    if git diff HEAD~1 --name-only | grep -E "(frontend/|package.json)"; then
        log "🔨 Reconstruyendo frontend..."
        docker-compose -f docker-compose.prod.yml build frontend
        docker-compose -f docker-compose.prod.yml up -d frontend
    fi
    
    # Ejecutar migraciones si es necesario
    if git diff HEAD~1 --name-only | grep -E "(prisma/|migrations)"; then
        log "🗄️ Ejecutando migraciones..."
        docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    fi
    
    # Verificar salud
    sleep 10
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log "✅ Hotfix aplicado exitosamente"
    else
        error "❌ Error aplicando hotfix"
    fi
}

# Función para aplicar nueva funcionalidad
apply_feature() {
    log "🚀 Aplicando nueva funcionalidad..."
    
    # Crear backup
    backup_date=$(create_backup "feature")
    
    # Detener servicios
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down
    
    # Actualizar código
    git fetch origin
    git checkout main
    git pull origin main
    
    # Reconstruir todo
    log "🔨 Reconstruyendo servicios..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Ejecutar migraciones
    log "🗄️ Ejecutando migraciones..."
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 10
    docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
    
    # Iniciar servicios
    log "🚀 Iniciando servicios..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Verificar salud
    sleep 30
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        log "✅ Nueva funcionalidad aplicada exitosamente"
    else
        error "❌ Error aplicando nueva funcionalidad"
    fi
}

# Función para rollback
rollback() {
    log "⏪ Realizando rollback..."
    
    # Listar backups disponibles
    echo "Backups disponibles:"
    ls -la $BACKUP_DIR/*.backup | tail -10
    
    read -p "Ingresa la fecha del backup a restaurar (YYYYMMDD_HHMMSS): " backup_date
    
    if [ ! -f "$BACKUP_DIR/env_backup_${backup_date}.backup" ]; then
        error "Backup no encontrado: $backup_date"
    fi
    
    # Detener servicios
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurar configuración
    cp $BACKUP_DIR/env_backup_${backup_date}.backup $APP_DIR/.env
    
    # Restaurar base de datos
    if [ -f "$BACKUP_DIR/db_backup_${backup_date}.sql" ]; then
        log "🗄️ Restaurando base de datos..."
        docker-compose -f docker-compose.prod.yml up -d postgres
        sleep 10
        docker exec -i procura-postgres psql -U procura_user -d procura_cobros_prod < $BACKUP_DIR/db_backup_${backup_date}.sql
    fi
    
    # Restaurar archivos
    if [ -f "$BACKUP_DIR/files_backup_${backup_date}.tar.gz" ]; then
        log "📁 Restaurando archivos..."
        tar -xzf $BACKUP_DIR/files_backup_${backup_date}.tar.gz -C $APP_DIR
    fi
    
    # Iniciar servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Rollback completado"
}

# Función para mostrar estado
show_status() {
    log "📊 Estado actual del sistema:"
    
    echo ""
    echo "🐳 Contenedores Docker:"
    docker-compose -f $APP_DIR/docker-compose.prod.yml ps
    
    echo ""
    echo "💾 Uso de disco:"
    df -h
    
    echo ""
    echo "🧠 Uso de memoria:"
    free -h
    
    echo ""
    echo "🌐 Servicios web:"
    if curl -f http://localhost:3002/health > /dev/null 2>&1; then
        echo "✅ Backend: OK"
    else
        echo "❌ Backend: ERROR"
    fi
    
    if curl -f http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend: OK"
    else
        echo "❌ Frontend: ERROR"
    fi
    
    echo ""
    echo "📋 Últimos backups:"
    ls -la $BACKUP_DIR/*.backup | tail -5
}

# Función para mostrar logs
show_logs() {
    log "📋 Mostrando logs recientes..."
    
    echo ""
    echo "🔧 Logs del backend:"
    docker-compose -f $APP_DIR/docker-compose.prod.yml logs --tail=20 backend
    
    echo ""
    echo "🌐 Logs de Nginx:"
    tail -20 /var/log/nginx/error.log
}

# Procesar argumentos
case "${1:-}" in
    --hotfix)
        apply_hotfix
        ;;
    --feature)
        apply_feature
        ;;
    --rollback)
        rollback
        ;;
    --backup)
        create_backup "manual"
        ;;
    --status)
        show_status
        ;;
    --logs)
        show_logs
        ;;
    --help)
        show_help
        ;;
    *)
        echo "Opción no válida. Usa --help para ver las opciones disponibles."
        exit 1
        ;;
esac




