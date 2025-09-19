#!/bin/bash

# 🚀 SCRIPT DE REINICIO BACKEND DEFINITIVO - ENTERPRISE GRADE
# Versión: 2.0
# Descripción: Reinicio completo y robusto del backend con validaciones

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Asegúrate de estar en el directorio del backend."
    exit 1
fi

log "🚀 INICIANDO REINICIO BACKEND DEFINITIVO - ENTERPRISE GRADE"

# 1. MATAR TODOS LOS PROCESOS
log "📋 1. Matando todos los procesos de Node.js..."
pkill -f "node.*dist" || warning "No se encontraron procesos node dist"
pkill -f "node.*index.js" || warning "No se encontraron procesos node index.js"
pkill -f "nodemon" || warning "No se encontraron procesos nodemon"

# Esperar a que los procesos terminen
sleep 3

# Verificar que no queden procesos
REMAINING_PROCESSES=$(ps aux | grep -E "node.*dist|node.*index.js|nodemon" | grep -v grep | wc -l)
if [ $REMAINING_PROCESSES -gt 0 ]; then
    warning "Aún quedan $REMAINING_PROCESSES procesos. Forzando terminación..."
    pkill -9 -f "node.*dist" || true
    pkill -9 -f "node.*index.js" || true
    pkill -9 -f "nodemon" || true
    sleep 2
fi

# 2. LIMPIAR CACHE Y ARCHIVOS COMPILADOS
log "🧹 2. Limpiando cache y archivos compilados..."
rm -rf dist/ || warning "No se pudo eliminar dist/"
rm -rf node_modules/.cache/ || warning "No se pudo eliminar cache de node_modules"
sleep 1

# 3. VERIFICAR DEPENDENCIAS
log "📦 3. Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    warning "node_modules no encontrado. Instalando dependencias..."
    npm install
fi

# 4. RECOMPILAR
log "🔨 4. Recompilando backend..."
npm run build

# 5. VERIFICAR COMPILACIÓN
if [ ! -f "dist/index.js" ]; then
    error "❌ La compilación falló - dist/index.js no encontrado"
    exit 1
fi

success "✅ Compilación exitosa"

# 6. VERIFICAR PUERTO DISPONIBLE
log "🔍 5. Verificando disponibilidad del puerto 3002..."
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    warning "Puerto 3002 aún en uso. Esperando liberación..."
    sleep 5
fi

# 7. INICIAR BACKEND
log "🚀 6. Iniciando backend..."
nohup node dist/index.js > backend.log 2>&1 &
BACKEND_PID=$!

# Guardar PID para referencia
echo $BACKEND_PID > backend.pid

# 8. ESPERAR Y VERIFICAR
log "⏳ 7. Esperando que el backend inicie..."
sleep 5

# 9. VERIFICAR QUE ESTÉ FUNCIONANDO
log "🔍 8. Verificando que el backend esté funcionando..."

# Intentar múltiples veces
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3002/health > /dev/null; then
        success "✅ Backend funcionando correctamente en puerto 3002"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        warning "Intento $RETRY_COUNT/$MAX_RETRIES: Backend no responde, esperando..."
        sleep 3
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "❌ Backend no responde después de $MAX_RETRIES intentos"
    
    # Mostrar logs para debugging
    log "📋 Últimas líneas del log del backend:"
    tail -20 backend.log || true
    
    # Terminar proceso
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 10. VERIFICACIÓN FINAL
log "🔍 9. Verificación final del sistema..."

# Verificar que el proceso esté corriendo
if ps -p $BACKEND_PID > /dev/null; then
    success "✅ Proceso backend activo (PID: $BACKEND_PID)"
else
    error "❌ Proceso backend no encontrado"
    exit 1
fi

# Verificar respuesta del health check
HEALTH_RESPONSE=$(curl -s http://localhost:3002/health)
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    success "✅ Health check respondiendo correctamente"
else
    warning "⚠️ Health check respondió pero formato inesperado: $HEALTH_RESPONSE"
fi

# 11. RESUMEN FINAL
log "📊 RESUMEN DEL REINICIO:"
success "✅ Backend funcionando correctamente en puerto 3002"
success "✅ PID del proceso: $BACKEND_PID"
success "✅ Archivo PID guardado en: backend.pid"
success "✅ Logs disponibles en: backend.log"

echo ""
success "🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!"
echo ""
log "📋 Comandos útiles:"
echo "   Ver logs: tail -f backend.log"
echo "   Verificar estado: curl http://localhost:3002/health"
echo "   Terminar proceso: kill \$(cat backend.pid)"
echo ""

# Mostrar información del sistema
log "📊 Información del sistema:"
echo "   Memoria disponible: $(free -h | grep Mem | awk '{print $7}')"
echo "   CPU: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d'%' -f1)%"
echo "   Puerto 3002: $(lsof -i :3002 | grep LISTEN | wc -l) procesos escuchando"
