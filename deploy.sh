#!/bin/bash

# ========================================
# SCRIPT DE DESPLIEGUE A PRODUCCIÓN
# ========================================

set -e

# Configuración
APP_NAME="procura-cobros"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
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

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "No se encontró docker-compose.prod.yml. Ejecuta este script desde el directorio raíz del proyecto."
fi

# Verificar que el usuario tiene permisos
if [ "$EUID" -eq 0 ]; then
    error "No ejecutes este script como root. Usa el usuario 'procura'."
fi

log "🚀 Iniciando despliegue de $APP_NAME..."

# Crear backup antes del despliegue
log "💾 Creando backup antes del despliegue..."
mkdir -p $BACKUP_DIR
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Backup de base de datos
if docker ps | grep -q procura-postgres; then
    log "📊 Creando backup de base de datos..."
    docker exec procura-postgres pg_dump -U procura_user procura_cobros_prod > $BACKUP_DIR/db_backup_$BACKUP_DATE.sql
    log "✅ Backup de base de datos creado: db_backup_$BACKUP_DATE.sql"
else
    warning "No se pudo crear backup de base de datos (contenedor no está corriendo)"
fi

# Backup de archivos
if [ -d "$APP_DIR/uploads" ]; then
    log "📁 Creando backup de archivos..."
    tar -czf $BACKUP_DIR/files_backup_$BACKUP_DATE.tar.gz -C $APP_DIR uploads
    log "✅ Backup de archivos creado: files_backup_$BACKUP_DATE.tar.gz"
fi

# Detener servicios actuales
log "⏹️ Deteniendo servicios actuales..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    docker-compose -f docker-compose.prod.yml down || warning "No se pudieron detener todos los servicios"
fi

# Actualizar código
log "📥 Actualizando código..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main
git clean -fd

# Verificar variables de entorno
log "🔍 Verificando variables de entorno..."
if [ ! -f ".env" ]; then
    error "No se encontró archivo .env. Crea uno basado en production.env.example"
fi

# Verificar que las variables críticas estén configuradas
source .env
if [ -z "$JWT_SECRET" ] || [ -z "$DATABASE_URL" ]; then
    error "Variables de entorno críticas no configuradas (JWT_SECRET, DATABASE_URL)"
fi

# Construir imágenes
log "🔨 Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Ejecutar migraciones de base de datos
log "🗄️ Ejecutando migraciones de base de datos..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10

# Esperar a que PostgreSQL esté listo
log "⏳ Esperando a que PostgreSQL esté listo..."
until docker exec procura-postgres pg_isready -U procura_user -d procura_cobros_prod; do
    log "Esperando a PostgreSQL..."
    sleep 2
done

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Iniciar servicios
log "🚀 Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar salud de los servicios
log "🏥 Verificando salud de los servicios..."

# Verificar backend
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    log "✅ Backend está funcionando correctamente"
else
    error "❌ Backend no está respondiendo"
fi

# Verificar frontend
if curl -f http://localhost > /dev/null 2>&1; then
    log "✅ Frontend está funcionando correctamente"
else
    error "❌ Frontend no está respondiendo"
fi

# Verificar base de datos
if docker exec procura-postgres pg_isready -U procura_user -d procura_cobros_prod > /dev/null 2>&1; then
    log "✅ Base de datos está funcionando correctamente"
else
    error "❌ Base de datos no está respondiendo"
fi

# Limpiar imágenes Docker no utilizadas
log "🧹 Limpiando imágenes Docker no utilizadas..."
docker image prune -f

# Verificar logs de errores
log "📋 Verificando logs de errores..."
if docker-compose -f docker-compose.prod.yml logs --tail=50 | grep -i error; then
    warning "Se encontraron errores en los logs. Revisa manualmente."
fi

log "🎉 ¡Despliegue completado exitosamente!"
log "📊 Resumen del despliegue:"
log "   - Backup creado: $BACKUP_DATE"
log "   - Servicios iniciados: backend, frontend, postgres"
log "   - URLs:"
log "     - Frontend: https://tu-dominio.com"
log "     - API: https://tu-dominio.com/api"
log "     - Health: https://tu-dominio.com/health"

# Mostrar estado de los contenedores
log "📋 Estado de los contenedores:"
docker-compose -f docker-compose.prod.yml ps
