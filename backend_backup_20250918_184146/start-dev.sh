#!/bin/bash

echo "🚀 Iniciando servidor de desarrollo..."

# Limpiar procesos anteriores de manera más agresiva
echo "🧹 Limpiando procesos anteriores..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Esperar un momento
sleep 3

# Verificar que no hay procesos ejecutándose
echo "🔍 Verificando que no hay procesos ejecutándose..."
if pgrep -f "nodemon\|ts-node" > /dev/null; then
    echo "⚠️ Aún hay procesos ejecutándose, forzando terminación..."
    pkill -9 -f "nodemon\|ts-node" 2>/dev/null || true
    sleep 2
fi

# Verificar que el puerto esté libre
echo "🔍 Verificando que el puerto 3002 esté libre..."
if lsof -ti:3002 > /dev/null; then
    echo "⚠️ Puerto 3002 aún en uso, liberando..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "✅ Iniciando servidor en puerto 3002..."
# Usar npx para asegurar que usa la versión correcta
npx nodemon --config nodemon.json
