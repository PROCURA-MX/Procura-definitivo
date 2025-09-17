# ========================================
# DOCKERFILE PARA PRODUCCIÓN
# ========================================

# Usar Node.js 18 LTS
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Crear usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3002

# Comando de inicio
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
