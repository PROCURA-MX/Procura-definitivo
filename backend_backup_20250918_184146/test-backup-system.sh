#!/bin/bash

# Script de prueba para verificar el sistema de respaldos
# Autor: Sistema ProCura

echo "🧪 PRUEBA DEL SISTEMA DE RESPALDOS AUTOMÁTICOS"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
    else
        echo -e "${RED}❌ $test_name${NC}"
    fi
    
    if [ -n "$details" ]; then
        echo "   $details"
    fi
    echo ""
}

# Función para verificar archivo
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        show_result "$description" "PASS" "Archivo encontrado: $file"
        return 0
    else
        show_result "$description" "FAIL" "Archivo no encontrado: $file"
        return 1
    fi
}

# Función para verificar comando
check_command() {
    local command=$1
    local description=$2
    
    if command -v "$command" &> /dev/null; then
        show_result "$description" "PASS" "Comando disponible: $command"
        return 0
    else
        show_result "$description" "FAIL" "Comando no encontrado: $command"
        return 1
    fi
}

# Función para verificar conexión a la base de datos
test_database_connection() {
    echo -e "${BLUE}🔍 Probando conexión a la base de datos...${NC}"
    
    DB_HOST="ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech"
    DB_NAME="neondb"
    DB_USER="neondb_owner"
    DB_PASS="npg_gdL38fTWHYsa"
    
    if PGPASSWORD="$DB_PASS" psql --host="$DB_HOST" --port=5432 --username="$DB_USER" --dbname="$DB_NAME" --sslmode=require -c "SELECT 1;" &> /dev/null; then
        show_result "Conexión a base de datos" "PASS" "Conexión exitosa a Neon"
        return 0
    else
        show_result "Conexión a base de datos" "FAIL" "No se pudo conectar a Neon"
        return 1
    fi
}

# Función para verificar respaldo manual
test_manual_backup() {
    echo -e "${BLUE}🔍 Probando respaldo manual...${NC}"
    
    # Crear respaldo de prueba
    if ./backup-database.sh &> /dev/null; then
        # Verificar que se creó el archivo
        local latest_backup=$(ls -t /Users/paul/Bravo/modulosjuntos/backups/neon_backup_*.sql.gz 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            local size=$(du -h "$latest_backup" | cut -f1)
            show_result "Respaldo manual" "PASS" "Respaldo creado: $(basename "$latest_backup") ($size)"
            return 0
        else
            show_result "Respaldo manual" "FAIL" "No se encontró archivo de respaldo"
            return 1
        fi
    else
        show_result "Respaldo manual" "FAIL" "Error al ejecutar respaldo"
        return 1
    fi
}

# Función para verificar integridad del respaldo
test_backup_integrity() {
    echo -e "${BLUE}🔍 Verificando integridad del respaldo...${NC}"
    
    local latest_backup=$(ls -t /Users/paul/Bravo/modulosjuntos/backups/neon_backup_*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        if gzip -t "$latest_backup" 2>/dev/null; then
            show_result "Integridad del respaldo" "PASS" "Archivo no corrupto: $(basename "$latest_backup")"
            return 0
        else
            show_result "Integridad del respaldo" "FAIL" "Archivo corrupto: $(basename "$latest_backup")"
            return 1
        fi
    else
        show_result "Integridad del respaldo" "FAIL" "No hay respaldos para verificar"
        return 1
    fi
}

# Función para simular cron job
test_cron_simulation() {
    echo -e "${BLUE}🔍 Simulando ejecución de cron job...${NC}"
    
    # Simular la ejecución del script como lo haría cron
    local test_log="/tmp/backup_test_$(date +%s).log"
    
    if ./backup-database.sh > "$test_log" 2>&1; then
        if [ -f "$test_log" ]; then
            local success_count=$(grep -c "✅" "$test_log" || echo "0")
            if [ "$success_count" -gt 0 ]; then
                show_result "Simulación de cron" "PASS" "Script ejecutado exitosamente ($success_count éxitos)"
                rm -f "$test_log"
                return 0
            else
                show_result "Simulación de cron" "FAIL" "Script ejecutado pero sin éxitos"
                rm -f "$test_log"
                return 1
            fi
        else
            show_result "Simulación de cron" "FAIL" "No se generó log de prueba"
            return 1
        fi
    else
        show_result "Simulación de cron" "FAIL" "Error al ejecutar script"
        return 1
    fi
}

# Función para verificar permisos
test_permissions() {
    echo -e "${BLUE}🔍 Verificando permisos...${NC}"
    
    local backup_dir="/Users/paul/Bravo/modulosjuntos/backups"
    local script_dir="/Users/paul/Bravo/modulosjuntos/backend"
    
    # Verificar permisos del directorio de respaldos
    if [ -w "$backup_dir" ]; then
        show_result "Permisos de escritura" "PASS" "Directorio de respaldos escribible"
    else
        show_result "Permisos de escritura" "FAIL" "No se puede escribir en $backup_dir"
        return 1
    fi
    
    # Verificar permisos de ejecución de scripts
    if [ -x "$script_dir/backup-database.sh" ]; then
        show_result "Permisos de ejecución" "PASS" "Scripts ejecutables"
    else
        show_result "Permisos de ejecución" "FAIL" "Scripts no ejecutables"
        return 1
    fi
    
    return 0
}

# Función para mostrar estadísticas
show_statistics() {
    echo -e "${BLUE}📊 ESTADÍSTICAS DEL SISTEMA${NC}"
    echo "=================================="
    
    local backup_dir="/Users/paul/Bravo/modulosjuntos/backups"
    local backup_count=$(ls -1 "$backup_dir"/neon_backup_*.sql.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
    local oldest_backup=$(ls -t "$backup_dir"/neon_backup_*.sql.gz 2>/dev/null | tail -1 2>/dev/null)
    local newest_backup=$(ls -t "$backup_dir"/neon_backup_*.sql.gz 2>/dev/null | head -1 2>/dev/null)
    
    echo "📁 Total de respaldos: $backup_count"
    echo "💾 Tamaño total: $total_size"
    
    if [ -n "$oldest_backup" ]; then
        echo "📅 Respaldo más antiguo: $(basename "$oldest_backup")"
    fi
    
    if [ -n "$newest_backup" ]; then
        echo "📅 Respaldo más reciente: $(basename "$newest_backup")"
    fi
    
    echo ""
}

# Función para mostrar próximos respaldos
show_next_backups() {
    echo -e "${BLUE}⏰ PRÓXIMOS RESPALDOS AUTOMÁTICOS${NC}"
    echo "====================================="
    
    local now=$(date)
    echo "🕐 Hora actual: $now"
    echo ""
    echo "📅 Respaldos programados:"
    echo "   • Diario: 2:00 AM todos los días"
    echo "   • Semanal: 3:00 AM los domingos"
    echo "   • Mensual: 4:00 AM el primer día del mes"
    echo ""
    echo "📋 Cron jobs activos:"
    crontab -l | grep backup-database || echo "   No se encontraron cron jobs de respaldo"
    echo ""
}

# Función principal
main() {
    echo "🧪 INICIANDO PRUEBAS DEL SISTEMA DE RESPALDOS"
    echo "============================================="
    echo ""
    
    local total_tests=0
    local passed_tests=0
    
    # Test 1: Verificar comandos necesarios
    echo -e "${YELLOW}1. VERIFICANDO REQUISITOS${NC}"
    echo "------------------------"
    check_command "pg_dump" "PostgreSQL pg_dump" && ((passed_tests++))
    ((total_tests++))
    
    check_command "psql" "PostgreSQL psql" && ((passed_tests++))
    ((total_tests++))
    
    check_command "gzip" "Compresión gzip" && ((passed_tests++))
    ((total_tests++))
    
    # Test 2: Verificar archivos del sistema
    echo -e "${YELLOW}2. VERIFICANDO ARCHIVOS DEL SISTEMA${NC}"
    echo "--------------------------------"
    check_file "/Users/paul/Bravo/modulosjuntos/backend/backup-database.sh" "Script de respaldo" && ((passed_tests++))
    ((total_tests++))
    
    check_file "/Users/paul/Bravo/modulosjuntos/backend/restore-database.sh" "Script de restauración" && ((passed_tests++))
    ((total_tests++))
    
    check_file "/Users/paul/Bravo/modulosjuntos/backups/backup.log" "Log de respaldos" && ((passed_tests++))
    ((total_tests++))
    
    # Test 3: Verificar permisos
    echo -e "${YELLOW}3. VERIFICANDO PERMISOS${NC}"
    echo "----------------------"
    test_permissions && ((passed_tests++))
    ((total_tests++))
    
    # Test 4: Verificar conexión a base de datos
    echo -e "${YELLOW}4. VERIFICANDO CONEXIÓN A BASE DE DATOS${NC}"
    echo "----------------------------------------"
    test_database_connection && ((passed_tests++))
    ((total_tests++))
    
    # Test 5: Probar respaldo manual
    echo -e "${YELLOW}5. PROBANDO RESPALDO MANUAL${NC}"
    echo "---------------------------"
    test_manual_backup && ((passed_tests++))
    ((total_tests++))
    
    # Test 6: Verificar integridad
    echo -e "${YELLOW}6. VERIFICANDO INTEGRIDAD${NC}"
    echo "-------------------------"
    test_backup_integrity && ((passed_tests++))
    ((total_tests++))
    
    # Test 7: Simular cron job
    echo -e "${YELLOW}7. SIMULANDO CRON JOB${NC}"
    echo "----------------------"
    test_cron_simulation && ((passed_tests++))
    ((total_tests++))
    
    # Mostrar resultados finales
    echo -e "${BLUE}📋 RESULTADOS FINALES${NC}"
    echo "====================="
    echo -e "${GREEN}✅ Pruebas pasadas: $passed_tests/$total_tests${NC}"
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        echo -e "${GREEN}🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema está funcionando correctamente.${NC}"
    else
        echo -e "${RED}⚠️  Algunas pruebas fallaron. Revisa los errores arriba.${NC}"
    fi
    
    echo ""
    
    # Mostrar estadísticas y próximos respaldos
    show_statistics
    show_next_backups
    
    echo -e "${BLUE}📚 COMANDOS ÚTILES PARA MONITOREAR${NC}"
    echo "====================================="
    echo "• Ver logs en tiempo real: tail -f /Users/paul/Bravo/modulosjuntos/backups/backup.log"
    echo "• Ver cron jobs: crontab -l"
    echo "• Respaldo manual: ./backup-database.sh"
    echo "• Listar respaldos: ./restore-database.sh -l"
    echo "• Verificar integridad: gzip -t /Users/paul/Bravo/modulosjuntos/backups/neon_backup_*.sql.gz"
    echo ""
    
    return $((total_tests - passed_tests))
}

# Ejecutar función principal
main "$@"
