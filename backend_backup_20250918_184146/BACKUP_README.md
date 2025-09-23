# Sistema de Respaldos Automáticos - ProCura

## 📋 Resumen

Este sistema proporciona respaldos automáticos de la base de datos Neon para el sistema ProCura, asegurando la protección de datos críticos del negocio.

## 🗂️ Archivos del Sistema

### Scripts Principales
- `backup-database.sh` - Script principal de respaldo
- `setup-automatic-backups.sh` - Configuración de respaldos automáticos
- `restore-database.sh` - Script de restauración de respaldos

### Directorios
- `/Users/paul/Bravo/modulosjuntos/backups/` - Directorio de respaldos
- `/Users/paul/Bravo/modulosjuntos/backups/backup.log` - Log de respaldos
- `/Users/paul/Bravo/modulosjuntos/backups/cron.log` - Log de cron jobs

## ⏰ Programación de Respaldos

### Respaldos Automáticos (Cron Jobs)
- **Diario**: 2:00 AM todos los días
- **Semanal**: 3:00 AM los domingos  
- **Mensual**: 4:00 AM el primer día del mes

### Retención
- Los respaldos se mantienen por **7 días**
- Los respaldos antiguos se eliminan automáticamente

## 🚀 Comandos Principales

### Respaldo Manual
```bash
cd /Users/paul/Bravo/modulosjuntos/backend
./backup-database.sh
```

### Configurar Respaldos Automáticos
```bash
cd /Users/paul/Bravo/modulosjuntos/backend
./setup-automatic-backups.sh
```

### Restaurar Base de Datos
```bash
cd /Users/paul/Bravo/modulosjuntos/backend

# Listar respaldos disponibles
./restore-database.sh -l

# Restaurar (modo prueba)
./restore-database.sh -t neon_backup_20250817_172128.sql.gz

# Restaurar (real)
./restore-database.sh neon_backup_20250817_172128.sql.gz
```

## 📊 Monitoreo

### Ver Cron Jobs
```bash
crontab -l
```

### Ver Logs
```bash
# Log de respaldos
tail -f /Users/paul/Bravo/modulosjuntos/backups/backup.log

# Log de cron
tail -f /Users/paul/Bravo/modulosjuntos/backups/cron.log
```

### Listar Respaldos
```bash
ls -la /Users/paul/Bravo/modulosjuntos/backups/
```

## 🔧 Configuración

### Base de Datos
- **Host**: ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech
- **Base de datos**: neondb
- **Usuario**: neondb_owner
- **SSL**: Requerido

### Requisitos
- PostgreSQL client (`pg_dump`, `psql`)
- Acceso a la base de datos Neon
- Permisos de escritura en el directorio de respaldos

## 🛡️ Características de Seguridad

### Verificación de Integridad
- Todos los respaldos se comprimen con gzip
- Se verifica la integridad de cada archivo comprimido
- Logs detallados de cada operación

### Respaldo de Seguridad
- Antes de restaurar, se crea un respaldo de la base de datos actual
- Nombres de archivo con timestamp para evitar conflictos

### Confirmación de Restauración
- Requiere confirmación explícita del usuario
- Modo de prueba disponible para verificar comandos

## 📈 Información de Respaldos

### Formato de Archivos
- **Nombre**: `neon_backup_YYYYMMDD_HHMMSS.sql.gz`
- **Ejemplo**: `neon_backup_20250817_172128.sql.gz`

### Tamaño Típico
- Respaldos actuales: ~12KB (comprimidos)
- Varía según la cantidad de datos

### Contenido
- Esquema completo de la base de datos
- Todos los datos de todas las tablas
- Índices y restricciones
- Configuraciones de la base de datos

## 🚨 Procedimientos de Emergencia

### Restauración Completa
1. Detener el backend: `pkill -f "node dist/index.js"`
2. Restaurar base de datos: `./restore-database.sh [archivo]`
3. Reiniciar backend: `node dist/index.js`

### Verificación Post-Restauración
1. Verificar conexión a la base de datos
2. Probar funcionalidades críticas
3. Verificar integridad de datos

## 📞 Contacto y Soporte

### Logs de Error
- Revisar `/Users/paul/Bravo/modulosjuntos/backups/backup.log`
- Revisar `/Users/paul/Bravo/modulosjuntos/backups/cron.log`

### Problemas Comunes
- **Error de conexión SSL**: Verificar configuración de Neon
- **Error de permisos**: Verificar permisos en directorio de respaldos
- **Error de pg_dump**: Verificar instalación de PostgreSQL client

## 🔄 Mantenimiento

### Limpieza Manual
```bash
# Eliminar respaldos antiguos manualmente
find /Users/paul/Bravo/modulosjuntos/backups/ -name "neon_backup_*.sql.gz" -mtime +7 -delete
```

### Actualización de Scripts
- Los scripts se actualizan automáticamente con el código
- Verificar permisos después de actualizaciones: `chmod +x *.sh`

## 📝 Notas Importantes

1. **Horarios**: Los respaldos automáticos se ejecutan en horarios de baja actividad
2. **Espacio**: Monitorear el espacio en disco del directorio de respaldos
3. **Red**: Los respaldos requieren conexión a internet estable
4. **Seguridad**: Los archivos de respaldo contienen datos sensibles, mantener seguros

---

**Última actualización**: 17 de Agosto, 2025
**Versión**: 1.0
**Autor**: Sistema ProCura
