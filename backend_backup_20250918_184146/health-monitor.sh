#!/bin/bash

echo "🏥 Health Monitor - ProCura System"

# Función para verificar el estado del backend
check_backend() {
    echo "🔍 Verificando estado del backend..."
    
    if curl -s http://localhost:3002/ > /dev/null; then
        echo "✅ Backend funcionando correctamente"
        return 0
    else
        echo "❌ Backend no responde"
        return 1
    fi
}

# Función para verificar el estado del frontend
check_frontend() {
    echo "🔍 Verificando estado del frontend..."
    
    if curl -s http://localhost:5173/ > /dev/null; then
        echo "✅ Frontend funcionando correctamente"
        return 0
    else
        echo "❌ Frontend no responde"
        return 1
    fi
}

# Función para verificar el estado de la base de datos
check_database() {
    echo "🔍 Verificando estado de la base de datos..."
    
    # Verificar que el proceso de Prisma esté funcionando
    if pgrep -f "prisma" > /dev/null; then
        echo "✅ Base de datos funcionando correctamente"
        return 0
    else
        echo "⚠️ Base de datos puede tener problemas"
        return 1
    fi
}

# Función para verificar el estado de los procesos
check_processes() {
    echo "🔍 Verificando estado de los procesos..."
    
    # Verificar nodemon
    if pgrep -f "nodemon" > /dev/null; then
        echo "✅ Nodemon ejecutándose"
    else
        echo "❌ Nodemon no está ejecutándose"
        return 1
    fi
    
    # Verificar ts-node
    if pgrep -f "ts-node" > /dev/null; then
        echo "✅ ts-node ejecutándose"
    else
        echo "❌ ts-node no está ejecutándose"
        return 1
    fi
    
    return 0
}

# Función para reiniciar el backend si es necesario
restart_backend() {
    echo "🔄 Reiniciando backend..."
    
    # Matar procesos existentes
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "ts-node" 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    
    # Esperar un momento
    sleep 3
    
    # Reiniciar
    cd /Users/paul/Bravo/modulosjuntos/backend
    ./start-robust.sh &
    
    # Esperar a que inicie
    sleep 10
    
    # Verificar que esté funcionando
    if check_backend; then
        echo "✅ Backend reiniciado exitosamente"
        return 0
    else
        echo "❌ Error al reiniciar backend"
        return 1
    fi
}

# Función principal
main() {
    echo "🔧 Iniciando monitoreo del sistema..."
    
    # Verificar backend
    if ! check_backend; then
        echo "⚠️ Backend no está funcionando, intentando reiniciar..."
        if restart_backend; then
            echo "✅ Backend restaurado"
        else
            echo "❌ No se pudo restaurar el backend"
            exit 1
        fi
    fi
    
    # Verificar frontend
    if ! check_frontend; then
        echo "⚠️ Frontend no está funcionando"
    fi
    
    # Verificar base de datos
    if ! check_database; then
        echo "⚠️ Base de datos puede tener problemas"
    fi
    
    # Verificar procesos
    if ! check_processes; then
        echo "⚠️ Algunos procesos no están ejecutándose"
    fi
    
    echo "✅ Monitoreo completado"
}

# Ejecutar función principal
main
