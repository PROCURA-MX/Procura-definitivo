#!/bin/bash

# Script de respaldo automático para Supabase
# Configurar con cron: 0 2 * * * /path/to/backup-script.sh

# Configuración
BACKUP_DIR="/Users/paul/Bravo/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="supabase_backup_$DATE.sql"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

# Hacer respaldo
echo "Iniciando respaldo: $BACKUP_FILE"
pg_dump postgresql://postgres:Garuesgay1808@db.xfcmnlysnptclkgxfeab.supabase.co:5432/postgres > "$BACKUP_DIR/$BACKUP_FILE"

# Comprimir respaldo
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Mantener solo los últimos 7 respaldos
cd "$BACKUP_DIR"
ls -t *.sql.gz | tail -n +8 | xargs -r rm

echo "Respaldo completado: $BACKUP_FILE.gz"
echo "Fecha: $(date)" 