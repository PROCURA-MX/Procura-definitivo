# Sistema Integrado ProCura

Sistema de gestión médica con módulos de cobros e inventario.

## 🚀 Inicio Rápido

### Opción 1: Un solo comando (Recomendado)
```bash
npm start
```

### Opción 2: Modo desarrollo
```bash
npm run dev
```

### Opción 3: Manual (si hay problemas)
```bash
# Terminal 1 - Backend de cobros
cd backend
npm start

# Terminal 2 - Módulo de inventario  
cd inventory-module
npm start

# Terminal 3 - Frontend
cd frontend
npm run dev
```

## 📁 Estructura del Proyecto

- **`backend/`** - API de cobros (Express + Prisma + SQLite)
- **`inventory-module/`** - API de inventario (NestJS + PostgreSQL)
- **`frontend/`** - Interfaz web (React + Vite + TypeScript)

## 🛠️ Configuración

### Base de Datos
- **Cobros**: SQLite local (`backend/dev.db`)
- **Inventario**: PostgreSQL (configurado en `inventory-module`)

### Variables de Entorno
```bash
# .env (raíz del proyecto)
DATABASE_URL=file:./dev.db
NODE_ENV=development
JWT_SECRET=supersecreto123
```

## 📊 Puertos por Defecto

- **Frontend**: http://localhost:5173
- **Backend Cobros**: http://localhost:4000
- **Módulo Inventario**: http://localhost:3000

## 🔧 Comandos Útiles

```bash
# Instalar todas las dependencias
npm run install:all

# Compilar todo
npm run build

# Ejecutar tests
npm test

# Insertar datos de prueba (cobros)
cd backend
npm run seed
npm run seed-services
```

## 🎯 Para la Demo

1. Ejecuta `npm start` desde la raíz
2. Abre http://localhost:5173 en el navegador
3. Usa las credenciales de demo:
   - Email: `demo@procura.com`
   - Contraseña: (verificar en el código)

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
cd backend
npm run build
```

### Error: "Missing script: start"
El frontend usa `npm run dev`, no `npm start`

### Error de base de datos
```bash
cd backend
npx prisma db push
npm run seed
```

## 📝 Notas

- El módulo de inventario usa NestJS y PostgreSQL
- El backend de cobros usa Express y SQLite local
- Ambos módulos funcionan independientemente
- El frontend se conecta a ambos backends 