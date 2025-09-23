#!/bin/bash

echo "🚀 Iniciando servidor de desarrollo - VERSIÓN ROBUSTA"

# Función para limpiar procesos
cleanup_processes() {
    echo "🧹 Limpiando procesos anteriores..."
    
    # Matar procesos por nombre
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "ts-node" 2>/dev/null || true
    pkill -f "npm" 2>/dev/null || true
    
    # Matar procesos por puerto
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    
    # Esperar un momento
    sleep 2
    
    # Verificar que no hay procesos ejecutándose
    if pgrep -f "nodemon\|ts-node" > /dev/null; then
        echo "⚠️ Aún hay procesos ejecutándose, forzando terminación..."
        pkill -9 -f "nodemon\|ts-node" 2>/dev/null || true
        sleep 2
    fi
    
    # Verificar que el puerto esté libre
    if lsof -ti:3002 > /dev/null; then
        echo "⚠️ Puerto 3002 aún en uso, liberando..."
        lsof -ti:3002 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Función para verificar dependencias
check_dependencies() {
    echo "🔍 Verificando dependencias..."
    
    # Verificar que Node.js esté instalado
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js no está instalado"
        exit 1
    fi
    
    # Verificar que npm esté instalado
    if ! command -v npm &> /dev/null; then
        echo "❌ npm no está instalado"
        exit 1
    fi
    
    # Verificar que el directorio node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "⚠️ node_modules no existe, instalando dependencias..."
        npm install
    fi
    
    # Verificar que nodemon esté instalado
    if [ ! -f "node_modules/.bin/nodemon" ]; then
        echo "⚠️ nodemon no está instalado, instalando..."
        npm install nodemon --save-dev
    fi
    
    # Verificar que ts-node esté instalado
    if [ ! -f "node_modules/.bin/ts-node" ]; then
        echo "⚠️ ts-node no está instalado, instalando..."
        npm install ts-node --save-dev
    fi
}

# Función para verificar configuración
check_config() {
    echo "🔍 Verificando configuración..."
    
    # Verificar que nodemon.json existe
    if [ ! -f "nodemon.json" ]; then
        echo "❌ nodemon.json no existe"
        exit 1
    fi
    
    # Verificar que index.ts existe
    if [ ! -f "index.ts" ]; then
        echo "❌ index.ts no existe"
        exit 1
    fi
    
    # Verificar que .env existe
    if [ ! -f ".env" ]; then
        echo "⚠️ .env no existe, creando desde .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            echo "❌ .env.example no existe"
            exit 1
        fi
    fi
}

# Función para iniciar el servidor
start_server() {
    echo "✅ Iniciando servidor en puerto 3002..."
    
    # Usar npx para asegurar que usa la versión correcta
    npx nodemon --config nodemon.json
}

# Función principal
main() {
    echo "🔧 Iniciando proceso de inicio robusto..."
    
    # Limpiar procesos
    cleanup_processes
    
    # Verificar dependencias
    check_dependencies
    
    # Verificar configuración
    check_config
    
    # Iniciar servidor
    start_server
}

# Ejecutar función principal
main
