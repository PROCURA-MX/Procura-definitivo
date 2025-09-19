#!/bin/bash

# Script para monitorear respaldos automáticos
# Autor: Sistema ProCura

echo "📊 MONITOR DE RESPALDOS AUTOMÁTICOS - PROCURA"
echo "============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="/Users/paul/Bravo/modulosjuntos/backups"
BACKUP_LOG="$BACKUP_DIR/backup.log"
CRON_LOG="$BACKUP_DIR/cron.log"

# Función para mostrar estado
show_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
    fi
}

# Función para verificar si hay respaldos recientes
check_recent_backups() {
    echo -e "${BLUE}🔍 Verificando respaldos recientes...${NC}"
    
    local recent_backups=$(find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -mtime -1 2>/dev/null | wc -l)
    local today_backups=$(find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -newermt "$(date +%Y-%m-%d)" 2>/dev/null | wc -l)
    
    echo "📅 Respaldos en las últimas 24 horas: $recent_backups"
    echo "📅 Respaldos hoy: $today_backups"
    
    if [ "$today_backups" -gt 0 ]; then
        show_status "OK" "Hay respaldos recientes"
        
        echo "📋 Respaldos de hoy:"
        find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -newermt "$(date +%Y-%m-%d)" 2>/dev/null | while read -r backup; do
            local size=$(du -h "$backup" | cut -f1)
            local time=$(stat -f "%Sm" -t "%H:%M:%S" "$backup")
            echo "   • $(basename "$backup") - $size - $time"
        done
    else
        show_status "WARNING" "No hay respaldos de hoy"
    fi
    
    echo ""
}

# Función para verificar logs de respaldos
check_backup_logs() {
    echo -e "${BLUE}🔍 Verificando logs de respaldos...${NC}"
    
    if [ -f "$BACKUP_LOG" ]; then
        local last_log_entry=$(tail -1 "$BACKUP_LOG" 2>/dev/null)
        local log_size=$(du -h "$BACKUP_LOG" | cut -f1)
        
        echo "📝 Log de respaldos: $log_size"
        
        if [ -n "$last_log_entry" ]; then
            echo "📋 Última entrada: $last_log_entry"
            
            # Verificar si hay errores recientes
            local recent_errors=$(grep -c "❌\|Error\|FAIL" "$BACKUP_LOG" 2>/dev/null || echo "0")
            if [ "$recent_errors" -gt 0 ]; then
                show_status "WARNING" "Se encontraron $recent_errors errores en los logs"
            else
                show_status "OK" "No hay errores recientes en los logs"
            fi
        else
            show_status "WARNING" "Log vacío"
        fi
    else
        show_status "WARNING" "No se encontró el archivo de log"
    fi
    
    echo ""
}

# Función para verificar cron jobs
check_cron_jobs() {
    echo -e "${BLUE}🔍 Verificando cron jobs...${NC}"
    
    local cron_jobs=$(crontab -l 2>/dev/null | grep -c "backup-database" || echo "0")
    
    if [ "$cron_jobs" -gt 0 ]; then
        show_status "OK" "Se encontraron $cron_jobs cron jobs de respaldo"
        
        echo "📋 Cron jobs activos:"
        crontab -l | grep "backup-database" | while read -r job; do
            echo "   • $job"
        done
    else
        show_status "WARNING" "No se encontraron cron jobs de respaldo"
    fi
    
    echo ""
}

# Función para verificar espacio en disco
check_disk_space() {
    echo -e "${BLUE}🔍 Verificando espacio en disco...${NC}"
    
    local backup_dir_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local backup_count=$(ls -1 "$BACKUP_DIR"/neon_backup_*.sql.gz 2>/dev/null | wc -l)
    
    echo "💾 Tamaño del directorio de respaldos: $backup_dir_size"
    echo "📁 Total de respaldos: $backup_count"
    
    # Verificar si hay muchos respaldos antiguos
    local old_backups=$(find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -mtime +7 2>/dev/null | wc -l)
    if [ "$old_backups" -gt 0 ]; then
        show_status "WARNING" "Hay $old_backups respaldos antiguos (>7 días)"
    else
        show_status "OK" "Limpieza de respaldos funcionando correctamente"
    fi
    
    echo ""
}

# Función para verificar integridad de respaldos
check_backup_integrity() {
    echo -e "${BLUE}🔍 Verificando integridad de respaldos...${NC}"
    
    local corrupted_count=0
    local total_count=0
    
    for backup in "$BACKUP_DIR"/neon_backup_*.sql.gz; do
        if [ -f "$backup" ]; then
            ((total_count++))
            if ! gzip -t "$backup" 2>/dev/null; then
                ((corrupted_count++))
                show_status "WARNING" "Archivo corrupto: $(basename "$backup")"
            fi
        fi
    done
    
    if [ "$corrupted_count" -eq 0 ] && [ "$total_count" -gt 0 ]; then
        show_status "OK" "Todos los $total_count respaldos están íntegros"
    elif [ "$total_count" -eq 0 ]; then
        show_status "WARNING" "No se encontraron respaldos"
    else
        show_status "WARNING" "$corrupted_count de $total_count respaldos están corruptos"
    fi
    
    echo ""
}

# Función para mostrar próximos respaldos programados
show_schedule() {
    echo -e "${BLUE}⏰ PRÓXIMOS RESPALDOS PROGRAMADOS${NC}"
    echo "====================================="
    
    local now=$(date)
    echo "🕐 Hora actual: $now"
    echo ""
    
    # Calcular próximos respaldos
    local next_daily=$(date -v+1d -v2H -v0M -v0S +"%Y-%m-%d %H:%M:%S")
    local next_weekly=$(date -v+0d -v3H -v0M -v0S +"%Y-%m-%d %H:%M:%S")
    if [ "$(date +%u)" -ne 0 ]; then
        next_weekly=$(date -v+$((7-$(date +%u)))d -v3H -v0M -v0S +"%Y-%m-%d %H:%M:%S")
    fi
    
    echo "📅 Próximos respaldos:"
    echo "   • Diario: $next_daily"
    echo "   • Semanal: $next_weekly"
    echo ""
}

# Función para mostrar estadísticas generales
show_statistics() {
    echo -e "${BLUE}📊 ESTADÍSTICAS GENERALES${NC}"
    echo "============================="
    
    local total_backups=$(ls -1 "$BACKUP_DIR"/neon_backup_*.sql.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local oldest_backup=$(ls -t "$BACKUP_DIR"/neon_backup_*.sql.gz 2>/dev/null | tail -1 2>/dev/null)
    local newest_backup=$(ls -t "$BACKUP_DIR"/neon_backup_*.sql.gz 2>/dev/null | head -1 2>/dev/null)
    
    echo "📁 Total de respaldos: $total_backups"
    echo "💾 Tamaño total: $total_size"
    
    if [ -n "$oldest_backup" ]; then
        local oldest_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$oldest_backup")
        echo "📅 Respaldo más antiguo: $(basename "$oldest_backup") ($oldest_date)"
    fi
    
    if [ -n "$newest_backup" ]; then
        local newest_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$newest_backup")
        echo "📅 Respaldo más reciente: $(basename "$newest_backup") ($newest_date)"
    fi
    
    echo ""
}

# Función para mostrar alertas
show_alerts() {
    echo -e "${BLUE}🚨 ALERTAS Y RECOMENDACIONES${NC}"
    echo "================================"
    
    local alerts=0
    
    # Verificar si hay respaldos de hoy
    local today_backups=$(find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -newermt "$(date +%Y-%m-%d)" 2>/dev/null | wc -l)
    if [ "$today_backups" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No hay respaldos de hoy${NC}"
        ((alerts++))
    fi
    
    # Verificar errores en logs
    local recent_errors=$(grep -c "❌\|Error\|FAIL" "$BACKUP_LOG" 2>/dev/null || echo "0")
    if [ "$recent_errors" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Hay $recent_errors errores recientes en los logs${NC}"
        ((alerts++))
    fi
    
    # Verificar cron jobs
    local cron_jobs=$(crontab -l 2>/dev/null | grep -c "backup-database" || echo "0")
    if [ "$cron_jobs" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No hay cron jobs de respaldo configurados${NC}"
        ((alerts++))
    fi
    
    # Verificar espacio
    local old_backups=$(find "$BACKUP_DIR" -name "neon_backup_*.sql.gz" -mtime +7 2>/dev/null | wc -l)
    if [ "$old_backups" -gt 5 ]; then
        echo -e "${YELLOW}⚠️  Hay muchos respaldos antiguos ($old_backups)${NC}"
        ((alerts++))
    fi
    
    if [ "$alerts" -eq 0 ]; then
        echo -e "${GREEN}✅ No hay alertas - Sistema funcionando correctamente${NC}"
    fi
    
    echo ""
}

# Función principal
main() {
    echo "🕐 Iniciando monitoreo: $(date)"
    echo ""
    
    check_recent_backups
    check_backup_logs
    check_cron_jobs
    check_disk_space
    check_backup_integrity
    show_statistics
    show_schedule
    show_alerts
    
    echo -e "${BLUE}📚 COMANDOS ÚTILES${NC}"
    echo "===================="
    echo "• Ver logs en tiempo real: tail -f $BACKUP_LOG"
    echo "• Respaldo manual: ./backup-database.sh"
    echo "• Listar respaldos: ./restore-database.sh -l"
    echo "• Ejecutar prueba completa: ./test-backup-system.sh"
    echo "• Ver cron jobs: crontab -l"
    echo ""
    
    echo "🕐 Monitoreo completado: $(date)"
}

# Ejecutar función principal
main "$@"
