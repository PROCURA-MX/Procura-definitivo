#!/bin/bash

# ========================================
# SCRIPT DE CONFIGURACIÓN INICIAL DEL SERVIDOR
# ========================================

set -e

echo "🚀 Configurando servidor para Procura Cobros..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar dependencias básicas
echo "🔧 Instalando dependencias..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim

# Instalar Node.js 18 LTS
echo "📦 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Instalar Docker Compose
echo "🐳 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
echo "🌐 Instalando Nginx..."
apt install -y nginx

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configurar fail2ban
echo "🛡️ Configurando fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Crear usuario para la aplicación
echo "👤 Creando usuario de aplicación..."
useradd -m -s /bin/bash procura
usermod -aG docker procura
usermod -aG www-data procura

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p /var/www/procura-cobros
mkdir -p /var/log/procura-cobros
mkdir -p /var/backups/procura-cobros
mkdir -p /etc/ssl/procura-cobros

# Configurar permisos
chown -R procura:procura /var/www/procura-cobros
chown -R procura:procura /var/log/procura-cobros
chown -R procura:procura /var/backups/procura-cobros

# Configurar logrotate
echo "📝 Configurando logrotate..."
cat > /etc/logrotate.d/procura-cobros << EOF
/var/log/procura-cobros/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 procura procura
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Configurar backup automático
echo "💾 Configurando backup automático..."
cat > /etc/cron.daily/procura-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/procura-cobros"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker exec procura-postgres pg_dump -U procura_user procura_cobros_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/procura-cobros/uploads

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /etc/cron.daily/procura-backup

# Configurar monitoreo básico
echo "📊 Configurando monitoreo..."
cat > /etc/cron.d/procura-monitor << 'EOF'
# Monitoreo cada 5 minutos
*/5 * * * * procura /usr/local/bin/procura-health-check.sh
EOF

cat > /usr/local/bin/procura-health-check.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/procura-cobros/health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Verificar que los contenedores estén corriendo
if ! docker ps | grep -q procura-backend; then
    echo "[$DATE] ERROR: Backend container not running" >> $LOG_FILE
    # Aquí podrías enviar una notificación
fi

if ! docker ps | grep -q procura-postgres; then
    echo "[$DATE] ERROR: PostgreSQL container not running" >> $LOG_FILE
fi

# Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Verificar memoria
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/procura-health-check.sh

echo "✅ Configuración del servidor completada!"
echo "📋 Próximos pasos:"
echo "1. Configurar SSL con Let's Encrypt"
echo "2. Clonar el repositorio"
echo "3. Configurar variables de entorno"
echo "4. Ejecutar migraciones de base de datos"
echo "5. Iniciar la aplicación"
