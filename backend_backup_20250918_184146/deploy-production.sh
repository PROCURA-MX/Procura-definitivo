#!/bin/bash

# Script de despliegue para producción - ProCura System
# Ejecutar con: chmod +x deploy-production.sh && ./deploy-production.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue de ProCura para producción..."

# ========================================
# 1. VERIFICACIONES PREVIAS
# ========================================

echo "📋 Verificando requisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    exit 1
fi

# Verificar variables de entorno
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurada"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET no está configurada"
    exit 1
fi

echo "✅ Todos los requisitos están cumplidos"

# ========================================
# 2. INSTALACIÓN DE DEPENDENCIAS
# ========================================

echo "📦 Instalando dependencias..."

# Instalar dependencias del backend
cd backend
npm ci --only=production
npm install

# Instalar dependencias del frontend
cd ../frontend
npm ci --only=production
npm install

cd ..

echo "✅ Dependencias instaladas"

# ========================================
# 3. CONSTRUCCIÓN
# ========================================

echo "🔨 Construyendo aplicación..."

# Construir backend
cd backend
npm run build

# Construir frontend
cd ../frontend
npm run build

cd ..

echo "✅ Aplicación construida"

# ========================================
# 4. OPTIMIZACIÓN DE BASE DE DATOS
# ========================================

echo "🗄️ Optimizando base de datos..."

# Ejecutar script de optimización
cd backend
psql $DATABASE_URL -f optimize-production-database.sql

cd ..

echo "✅ Base de datos optimizada"

# ========================================
# 5. CONFIGURACIÓN DE PRODUCCIÓN
# ========================================

echo "⚙️ Configurando para producción..."

# Crear archivo .env de producción si no existe
if [ ! -f "backend/.env.production" ]; then
    cat > backend/.env.production << EOF
NODE_ENV=production
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
PORT=3002
EOF
    echo "✅ Archivo .env.production creado"
fi

# Configurar PM2 para gestión de procesos
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Crear archivo de configuración PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'procura-backend',
      script: './backend/dist/index.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

echo "✅ Configuración de producción completada"

# ========================================
# 6. CREAR DIRECTORIOS DE LOGS
# ========================================

echo "📝 Configurando logs..."

mkdir -p backend/logs
mkdir -p logs

echo "✅ Directorios de logs creados"

# ========================================
# 7. DESPLIEGUE CON PM2
# ========================================

echo "🚀 Desplegando con PM2..."

# Detener procesos existentes
pm2 delete procura-backend 2>/dev/null || true

# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Guardar configuración PM2
pm2 save

# Configurar PM2 para iniciar automáticamente
pm2 startup

echo "✅ Aplicación desplegada con PM2"

# ========================================
# 8. VERIFICACIÓN
# ========================================

echo "🔍 Verificando despliegue..."

# Esperar un momento para que la aplicación inicie
sleep 5

# Verificar que la aplicación esté corriendo
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Aplicación funcionando correctamente"
else
    echo "❌ Error: La aplicación no responde"
    pm2 logs procura-backend --lines 20
    exit 1
fi

# ========================================
# 9. MONITORING
# ========================================

echo "📊 Configurando monitoring..."

# Mostrar estado de PM2
pm2 status

# Mostrar logs recientes
echo "📋 Logs recientes:"
pm2 logs procura-backend --lines 10

# ========================================
# 10. INFORMACIÓN FINAL
# ========================================

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo ""
echo "📋 Información del despliegue:"
echo "   • Backend: http://localhost:3002"
echo "   • Health Check: http://localhost:3002/health"
echo "   • Frontend: http://localhost:5173"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs: pm2 logs procura-backend"
echo "   • Reiniciar: pm2 restart procura-backend"
echo "   • Estado: pm2 status"
echo "   • Monitoreo: pm2 monit"
echo ""
echo "📊 Métricas de performance:"
echo "   • En desarrollo: http://localhost:3002/metrics"
echo ""
echo "⚠️  Recordatorios importantes:"
echo "   • Configura un reverse proxy (nginx) para producción"
echo "   • Configura SSL/TLS para HTTPS"
echo "   • Configura backup automático de la base de datos"
echo "   • Monitorea regularmente los logs y métricas"
echo ""
echo "🚀 ¡Tu aplicación está lista para producción!" 