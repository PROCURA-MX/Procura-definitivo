# 🚀 CONFIGURAR GOOGLE CALENDAR - INSTRUCCIONES SIMPLES

## ✅ Archivo .env creado

Ya se creó el archivo `.env` con las variables necesarias. Solo necesitas reemplazar los valores de ejemplo.

## 🔧 Pasos para configurar:

### 1. Obtener credenciales de Google
- Ve a: https://console.cloud.google.com/
- Crea un proyecto o selecciona uno existente
- Habilita la API de Google Calendar
- Crea credenciales OAuth2
- Agrega URI de redirección: `http://localhost:3002/api/google/oauth-callback`

### 2. Editar el archivo .env
Abre el archivo `modulosjuntos/backend/.env` y reemplaza estas líneas:

```bash
# Cambiar estas líneas:
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Por tus credenciales reales:
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### 3. Reiniciar el backend
```bash
cd modulosjuntos/backend
npm run dev
```

### 4. Probar la conexión
```bash
curl http://localhost:3002/api/google/oauth-init
```

## 🎯 Endpoints disponibles:

- `GET /api/google/oauth-init` - Iniciar autenticación
- `GET /api/google/oauth-callback` - Callback de Google  
- `GET /api/google/status` - Estado de conexión
- `POST /api/google/disconnect` - Desconectar
- `GET /api/google/events` - Obtener eventos
- `POST /api/google/events` - Crear evento
- `PUT /api/google/events/:eventId` - Actualizar evento
- `DELETE /api/google/events/:eventId` - Eliminar evento

## 📋 Variables ya configuradas:

✅ `GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback`
✅ `DATABASE_URL` (ya configurada)
✅ `JWT_SECRET` (ya configurada)
✅ `PORT=3002` (ya configurada)

## 🔍 Verificar configuración:

Una vez que hayas configurado las credenciales, el backend debería funcionar correctamente y podrás conectar Google Calendar desde el frontend.

---

**¿Necesitas ayuda?** Revisa el archivo `google-calendar-setup.md` para instrucciones detalladas.













