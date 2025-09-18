# 🚀 Guía de Despliegue a Producción - Procura Cobros

## 📋 Tabla de Contenidos
1. [Preparación Pre-Despliegue](#preparación-pre-despliegue)
2. [Configuración del Servidor](#configuración-del-servidor)
3. [Despliegue Inicial](#despliegue-inicial)
4. [Configuración de SSL](#configuración-de-ssl)
5. [Flujo de Trabajo para Mantenimiento](#flujo-de-trabajo-para-mantenimiento)
6. [Monitoreo y Logs](#monitoreo-y-logs)
7. [Troubleshooting](#troubleshooting)

## 🔧 Preparación Pre-Despliegue

### 1. Crear Droplet en DigitalOcean

```bash
# Especificaciones recomendadas:
# - Ubuntu 22.04 LTS
# - 2GB RAM mínimo (4GB recomendado)
# - 50GB SSD
# - Región más cercana a tus usuarios
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp production.env.example .env

# Editar variables críticas
nano .env
```

**Variables críticas a configurar:**
- `JWT_SECRET`: Generar un secreto seguro único
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `CORS_ORIGIN`: Tu dominio de producción
- `GOOGLE_CLIENT_ID/SECRET`: Si usas integración con Google

### 3. Preparar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear migraciones
npx prisma migrate dev --name init

# Verificar migraciones
npx prisma migrate status
```

## 🖥️ Configuración del Servidor

### 1. Conectar al Servidor

```bash
# Conectar via SSH
ssh root@tu-servidor-ip

# O si usas clave SSH
ssh -i tu-clave.pem root@tu-servidor-ip
```

### 2. Ejecutar Script de Configuración

```bash
# Subir script al servidor
scp setup-server.sh root@tu-servidor-ip:/root/

# Ejecutar en el servidor
ssh root@tu-servidor-ip
chmod +x setup-server.sh
./setup-server.sh
```

### 3. Configurar Usuario de Aplicación

```bash
# Cambiar al usuario de aplicación
su - procura

# Configurar SSH para el usuario
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

## 🚀 Despliegue Inicial

### 1. Clonar Repositorio

```bash
# En el servidor, como usuario 'procura'
cd /var/www
git clone https://github.com/tu-usuario/procura-cobros.git
cd procura-cobros
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de producción
cp production.env.example .env

# Editar con tus valores
nano .env
```

### 3. Configurar SSL (Opcional pero Recomendado)

```bash
# Ejecutar script de SSL
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### 4. Ejecutar Despliegue

```bash
# Hacer ejecutable
chmod +x deploy.sh

# Ejecutar despliegue
./deploy.sh
```

### 5. Verificar Despliegue

```bash
# Verificar servicios
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar salud
curl http://localhost:3002/health
```

## 🔒 Configuración de SSL

### 1. Configurar Dominio

```bash
# En tu proveedor de DNS, crear registros:
# A     @           tu-servidor-ip
# A     www         tu-servidor-ip
```

### 2. Obtener Certificado SSL

```bash
# Ejecutar script de SSL
./setup-ssl.sh
```

### 3. Verificar SSL

```bash
# Verificar certificado
openssl s_client -connect tu-dominio.com:443 -servername tu-dominio.com

# Verificar renovación automática
certbot renew --dry-run
```

## 🔄 Flujo de Trabajo para Mantenimiento

### 1. Para Correcciones Rápidas (Hotfix)

```bash
# Aplicar hotfix sin downtime
./update.sh --hotfix
```

### 2. Para Nuevas Funcionalidades

```bash
# Aplicar nueva funcionalidad
./update.sh --feature
```

### 3. Para Revertir Cambios

```bash
# Ver backups disponibles
./update.sh --status

# Revertir a versión anterior
./update.sh --rollback
```

### 4. Para Crear Backup Manual

```bash
# Crear backup manual
./update.sh --backup
```

## 📊 Monitoreo y Logs

### 1. Ver Estado del Sistema

```bash
# Estado general
./update.sh --status

# Logs recientes
./update.sh --logs
```

### 2. Monitoreo Automático

```bash
# Ver logs de monitoreo
tail -f /var/log/procura-cobros/health.log

# Ver logs de aplicación
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Alertas por Email (Opcional)

```bash
# Configurar notificaciones por email
# Editar /usr/local/bin/procura-health-check.sh
# Agregar envío de email en caso de errores
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Servicio no inicia

```bash
# Ver logs del contenedor
docker-compose -f docker-compose.prod.yml logs backend

# Verificar variables de entorno
docker-compose -f docker-compose.prod.yml config

# Reiniciar servicio
docker-compose -f docker-compose.prod.yml restart backend
```

#### 2. Error de base de datos

```bash
# Verificar conexión
docker exec procura-postgres pg_isready -U procura_user

# Ver logs de PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres

# Restaurar desde backup
./update.sh --rollback
```

#### 3. Error de SSL

```bash
# Verificar certificado
certbot certificates

# Renovar certificado
certbot renew --force-renewal

# Verificar configuración de Nginx
nginx -t
```

#### 4. Problemas de memoria

```bash
# Ver uso de memoria
free -h
docker stats

# Limpiar contenedores no utilizados
docker system prune -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart
```

### Comandos de Emergencia

```bash
# Detener todos los servicios
docker-compose -f docker-compose.prod.yml down

# Iniciar solo base de datos
docker-compose -f docker-compose.prod.yml up -d postgres

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Acceder a contenedor
docker exec -it procura-backend bash
```

## 📝 Checklist de Despliegue

### Pre-Despliegue
- [ ] Variables de entorno configuradas
- [ ] Base de datos preparada
- [ ] Dominio configurado
- [ ] SSL configurado
- [ ] Backup inicial creado

### Post-Despliegue
- [ ] Servicios funcionando
- [ ] SSL funcionando
- [ ] Base de datos conectada
- [ ] Logs sin errores
- [ ] Monitoreo configurado
- [ ] Backup automático funcionando

## 🔐 Seguridad

### Medidas Implementadas
- ✅ Firewall configurado (UFW)
- ✅ Fail2ban para protección SSH
- ✅ SSL/TLS habilitado
- ✅ Headers de seguridad
- ✅ Rate limiting
- ✅ Contenedores como usuario no-root
- ✅ Logs de auditoría

### Recomendaciones Adicionales
- Cambiar puerto SSH por defecto
- Usar claves SSH en lugar de contraseñas
- Configurar backup en servidor remoto
- Monitorear logs regularmente
- Actualizar sistema regularmente

## 📞 Soporte

En caso de problemas:
1. Revisar logs: `./update.sh --logs`
2. Verificar estado: `./update.sh --status`
3. Crear backup: `./update.sh --backup`
4. Revertir cambios: `./update.sh --rollback`

---

**¡Tu aplicación está lista para producción! 🎉**


