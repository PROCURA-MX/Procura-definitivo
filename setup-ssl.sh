#!/bin/bash

# ========================================
# SCRIPT DE CONFIGURACIÓN SSL CON LET'S ENCRYPT
# ========================================

set -e

# Configuración
DOMAIN="tu-dominio.com"
EMAIL="tu-email@ejemplo.com"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log "🔒 Configurando SSL para $DOMAIN..."

# Instalar Certbot
log "📦 Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Detener Nginx temporalmente
log "⏹️ Deteniendo Nginx temporalmente..."
systemctl stop nginx

# Obtener certificado SSL
log "🔐 Obteniendo certificado SSL..."
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Verificar que el certificado se creó
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    error "No se pudo obtener el certificado SSL"
fi

log "✅ Certificado SSL obtenido exitosamente"

# Configurar renovación automática
log "🔄 Configurando renovación automática..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Crear enlaces simbólicos para Nginx
log "🔗 Creando enlaces simbólicos..."
mkdir -p /etc/ssl/procura-cobros
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/ssl/procura-cobros/cert.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/ssl/procura-cobros/key.pem

# Actualizar configuración de Nginx
log "🌐 Actualizando configuración de Nginx..."
cp nginx.conf /etc/nginx/nginx.conf
sed -i "s/tu-dominio.com/$DOMAIN/g" /etc/nginx/nginx.conf

# Verificar configuración de Nginx
log "🔍 Verificando configuración de Nginx..."
nginx -t

# Iniciar Nginx
log "🚀 Iniciando Nginx..."
systemctl start nginx
systemctl enable nginx

log "✅ Configuración SSL completada!"
log "🌐 Tu sitio está disponible en: https://$DOMAIN"
log "🔒 Certificado SSL válido hasta: $(openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)"



# ========================================
# SCRIPT DE CONFIGURACIÓN SSL CON LET'S ENCRYPT
# ========================================

set -e

# Configuración
DOMAIN="tu-dominio.com"
EMAIL="tu-email@ejemplo.com"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

log "🔒 Configurando SSL para $DOMAIN..."

# Instalar Certbot
log "📦 Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Detener Nginx temporalmente
log "⏹️ Deteniendo Nginx temporalmente..."
systemctl stop nginx

# Obtener certificado SSL
log "🔐 Obteniendo certificado SSL..."
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Verificar que el certificado se creó
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    error "No se pudo obtener el certificado SSL"
fi

log "✅ Certificado SSL obtenido exitosamente"

# Configurar renovación automática
log "🔄 Configurando renovación automática..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Crear enlaces simbólicos para Nginx
log "🔗 Creando enlaces simbólicos..."
mkdir -p /etc/ssl/procura-cobros
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/ssl/procura-cobros/cert.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/ssl/procura-cobros/key.pem

# Actualizar configuración de Nginx
log "🌐 Actualizando configuración de Nginx..."
cp nginx.conf /etc/nginx/nginx.conf
sed -i "s/tu-dominio.com/$DOMAIN/g" /etc/nginx/nginx.conf

# Verificar configuración de Nginx
log "🔍 Verificando configuración de Nginx..."
nginx -t

# Iniciar Nginx
log "🚀 Iniciando Nginx..."
systemctl start nginx
systemctl enable nginx

log "✅ Configuración SSL completada!"
log "🌐 Tu sitio está disponible en: https://$DOMAIN"
log "🔒 Certificado SSL válido hasta: $(openssl x509 -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)"




