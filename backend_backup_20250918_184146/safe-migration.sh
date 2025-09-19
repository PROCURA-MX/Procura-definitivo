#!/bin/bash

# Script de migración segura de Supabase a Neon
# Autor: Sistema ProCura
# Evita duplicados y maneja conflictos de forma segura

echo "🔄 MIGRACIÓN SEGURA DE SUPABASE A NEON"
echo "======================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
MIGRATION_FILE="/Users/paul/Bravo/modulosjuntos/backend/neon_data_migration.sql"
BACKUP_DIR="/Users/paul/Bravo/modulosjuntos/backups"
LOG_FILE="$BACKUP_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

# Configuración de base de datos
NEON_HOST="ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech"
NEON_DB="neondb"
NEON_USER="neondb_owner"
NEON_PASS="npg_gdL38fTWHYsa"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función para mostrar estado
show_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        log "SUCCESS: $message"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
        log "WARNING: $message"
    else
        echo -e "${RED}❌ $message${NC}"
        log "ERROR: $message"
    fi
}

# Función para verificar archivo de migración
check_migration_file() {
    echo -e "${BLUE}🔍 Verificando archivo de migración...${NC}"
    
    if [ ! -f "$MIGRATION_FILE" ]; then
        show_status "ERROR" "Archivo de migración no encontrado: $MIGRATION_FILE"
        return 1
    fi
    
    local file_size=$(du -h "$MIGRATION_FILE" | cut -f1)
    local line_count=$(wc -l < "$MIGRATION_FILE")
    
    echo "📁 Archivo: $MIGRATION_FILE"
    echo "📊 Tamaño: $file_size"
    echo "📝 Líneas: $line_count"
    
    if [ "$line_count" -lt 100 ]; then
        show_status "WARNING" "Archivo de migración parece muy pequeño"
        return 1
    fi
    
    show_status "OK" "Archivo de migración verificado"
    return 0
}

# Función para verificar conexión a Neon
check_neon_connection() {
    echo -e "${BLUE}🔍 Verificando conexión a Neon...${NC}"
    
    if PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -c "SELECT 1;" &> /dev/null; then
        show_status "OK" "Conexión a Neon establecida"
        return 0
    else
        show_status "ERROR" "No se pudo conectar a Neon"
        return 1
    fi
}

# Función para verificar estado actual de Neon
check_neon_state() {
    echo -e "${BLUE}🔍 Verificando estado actual de Neon...${NC}"
    
    local table_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    echo "📊 Tablas en Neon: $table_count"
    
    if [ "$table_count" -eq 0 ]; then
        show_status "WARNING" "No hay tablas en Neon"
        return 1
    fi
    
    # Verificar si hay datos en tablas principales
    local user_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | tr -d ' ')
    local org_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM organizaciones;" 2>/dev/null | tr -d ' ')
    
    echo "👥 Usuarios en Neon: $user_count"
    echo "🏢 Organizaciones en Neon: $org_count"
    
    if [ "$user_count" -gt 0 ] || [ "$org_count" -gt 0 ]; then
        show_status "WARNING" "Neon ya tiene datos. Se aplicará migración con manejo de conflictos."
    else
        show_status "OK" "Neon está vacío, migración directa segura"
    fi
    
    return 0
}

# Función para crear respaldo de seguridad
create_safety_backup() {
    echo -e "${BLUE}🔍 Creando respaldo de seguridad...${NC}"
    
    local backup_file="$BACKUP_DIR/safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    if PGPASSWORD="$NEON_PASS" PGSSLMODE=require pg_dump --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" --verbose --clean --if-exists --create --no-owner --no-privileges --schema=public --file="$backup_file" 2>/dev/null; then
        show_status "OK" "Respaldo de seguridad creado: $(basename "$backup_file")"
        return 0
    else
        show_status "WARNING" "No se pudo crear respaldo de seguridad, continuando..."
        return 1
    fi
}

# Función para preparar archivo de migración seguro
prepare_safe_migration() {
    echo -e "${BLUE}🔍 Preparando migración segura...${NC}"
    
    local safe_migration_file="$BACKUP_DIR/safe_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    # Crear archivo de migración seguro con ON CONFLICT
    cat > "$safe_migration_file" << 'EOF'
-- Migración segura de Supabase a Neon
-- Evita duplicados usando ON CONFLICT

BEGIN;

-- Deshabilitar triggers temporalmente para evitar conflictos
SET session_replication_role = replica;

-- Función para manejar conflictos de organizaciones
CREATE OR REPLACE FUNCTION handle_organization_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la organización ya existe, actualizar solo si es más reciente
    IF EXISTS (SELECT 1 FROM organizaciones WHERE id = NEW.id) THEN
        UPDATE organizaciones 
        SET nombre = NEW.nombre,
            rfc = NEW.rfc,
            direccion = NEW.direccion,
            telefono = NEW.telefono,
            email = NEW.email,
            logo_url = NEW.logo_url,
            color_primario = NEW.color_primario,
            color_secundario = NEW.color_secundario,
            updated_at = NEW.updated_at
        WHERE id = NEW.id AND updated_at < NEW.updated_at;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para organizaciones
DROP TRIGGER IF EXISTS organization_conflict_trigger ON organizaciones;
CREATE TRIGGER organization_conflict_trigger
    BEFORE INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION handle_organization_conflict();

-- Función para manejar conflictos de usuarios
CREATE OR REPLACE FUNCTION handle_user_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el usuario ya existe, actualizar solo si es más reciente
    IF EXISTS (SELECT 1 FROM usuarios WHERE id = NEW.id) THEN
        UPDATE usuarios 
        SET nombre = NEW.nombre,
            email = NEW.email,
            password_hash = NEW.password_hash,
            rol = NEW.rol,
            organizacion_id = NEW.organizacion_id,
            consultorio_id = NEW.consultorio_id,
            updated_at = NEW.updated_at
        WHERE id = NEW.id AND updated_at < NEW.updated_at;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para usuarios
DROP TRIGGER IF EXISTS user_conflict_trigger ON usuarios;
CREATE TRIGGER user_conflict_trigger
    BEFORE INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_conflict();

EOF

    # Agregar los INSERT statements del archivo original con ON CONFLICT
    echo "-- Datos de migración con manejo de conflictos" >> "$safe_migration_file"
    echo "" >> "$safe_migration_file"
    
    # Procesar el archivo original y agregar ON CONFLICT
    while IFS= read -r line; do
        if [[ $line =~ ^INSERT\ INTO ]]; then
            # Agregar ON CONFLICT DO NOTHING a los INSERT statements
            echo "$line ON CONFLICT DO NOTHING;" >> "$safe_migration_file"
        else
            echo "$line" >> "$safe_migration_file"
        fi
    done < "$MIGRATION_FILE"
    
    # Agregar finalización
    cat >> "$safe_migration_file" << 'EOF'

-- Habilitar triggers nuevamente
SET session_replication_role = DEFAULT;

-- Limpiar funciones temporales
DROP FUNCTION IF EXISTS handle_organization_conflict();
DROP FUNCTION IF EXISTS handle_user_conflict();

COMMIT;
EOF

    show_status "OK" "Archivo de migración seguro creado: $(basename "$safe_migration_file")"
    echo "$safe_migration_file"
}

# Función para ejecutar migración
execute_migration() {
    local migration_file=$1
    
    echo -e "${BLUE}🔄 Ejecutando migración segura...${NC}"
    
    log "Iniciando migración desde: $migration_file"
    
    if PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" --file="$migration_file" 2>&1 | tee -a "$LOG_FILE"; then
        show_status "OK" "Migración completada exitosamente"
        return 0
    else
        show_status "ERROR" "Error durante la migración"
        return 1
    fi
}

# Función para verificar resultados
verify_migration() {
    echo -e "${BLUE}🔍 Verificando resultados de la migración...${NC}"
    
    # Verificar datos principales
    local user_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | tr -d ' ')
    local org_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM organizaciones;" 2>/dev/null | tr -d ' ')
    local product_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM \"Product\";" 2>/dev/null | tr -d ' ')
    local patient_count=$(PGPASSWORD="$NEON_PASS" PGSSLMODE=require psql --host="$NEON_HOST" --port=5432 --username="$NEON_USER" --dbname="$NEON_DB" -t -c "SELECT COUNT(*) FROM pacientes;" 2>/dev/null | tr -d ' ')
    
    echo "📊 Resultados de la migración:"
    echo "   👥 Usuarios: $user_count"
    echo "   🏢 Organizaciones: $org_count"
    echo "   📦 Productos: $product_count"
    echo "   👤 Pacientes: $patient_count"
    
    if [ "$user_count" -gt 0 ] && [ "$org_count" -gt 0 ]; then
        show_status "OK" "Migración verificada exitosamente"
        return 0
    else
        show_status "WARNING" "Migración completada pero algunos datos pueden estar faltando"
        return 1
    fi
}

# Función principal
main() {
    echo "🕐 Iniciando migración segura: $(date)"
    echo ""
    
    # Crear directorio de logs si no existe
    mkdir -p "$BACKUP_DIR"
    
    # Paso 1: Verificar archivo de migración
    if ! check_migration_file; then
        echo -e "${RED}❌ No se puede continuar sin archivo de migración válido${NC}"
        exit 1
    fi
    
    # Paso 2: Verificar conexión a Neon
    if ! check_neon_connection; then
        echo -e "${RED}❌ No se puede continuar sin conexión a Neon${NC}"
        exit 1
    fi
    
    # Paso 3: Verificar estado actual de Neon
    if ! check_neon_state; then
        echo -e "${RED}❌ No se puede continuar - estado de Neon inválido${NC}"
        exit 1
    fi
    
    # Paso 4: Crear respaldo de seguridad
    create_safety_backup
    
    # Paso 5: Preparar migración segura
    local safe_migration_file=$(prepare_safe_migration)
    if [ -z "$safe_migration_file" ]; then
        echo -e "${RED}❌ Error al preparar migración segura${NC}"
        exit 1
    fi
    
    # Paso 6: Confirmar antes de ejecutar
    echo ""
    echo -e "${YELLOW}⚠️  CONFIRMACIÓN REQUERIDA${NC}"
    echo "================================"
    echo "Archivo de migración: $(basename "$safe_migration_file")"
    echo "Log de migración: $(basename "$LOG_FILE")"
    echo ""
    echo "¿Proceder con la migración segura? (sí/no): "
    read -r response
    
    if [[ ! "$response" =~ ^[Ss][IiÍí]$ ]]; then
        echo -e "${YELLOW}❌ Migración cancelada por el usuario${NC}"
        exit 0
    fi
    
    # Paso 7: Ejecutar migración
    if ! execute_migration "$safe_migration_file"; then
        echo -e "${RED}❌ Error durante la migración${NC}"
        echo "Revisa el log: $LOG_FILE"
        exit 1
    fi
    
    # Paso 8: Verificar resultados
    if ! verify_migration; then
        echo -e "${YELLOW}⚠️  Migración completada con advertencias${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 MIGRACIÓN COMPLETADA${NC}"
    echo "========================"
    echo "📁 Log de migración: $LOG_FILE"
    echo "📁 Archivo de migración: $safe_migration_file"
    echo "📁 Respaldo de seguridad: $BACKUP_DIR/safety_backup_*.sql.gz"
    echo ""
    echo "🕐 Migración completada: $(date)"
}

# Ejecutar función principal
main "$@"
