# Configuración de Google Calendar - Variables de Entorno

## Variables necesarias para el archivo .env

Agrega estas variables a tu archivo `.env` en el directorio `modulosjuntos/backend/`:

```bash
# Google Calendar Configuration
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback
```

## Pasos para obtener las credenciales de Google:

### 1. Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Inicia sesión con tu cuenta de Google

### 2. Crear o seleccionar un proyecto
- Si no tienes un proyecto, crea uno nuevo
- Si ya tienes un proyecto, selecciónalo

### 3. Habilitar la API de Google Calendar
- Ve a "APIs & Services" > "Library"
- Busca "Google Calendar API"
- Haz clic en "Enable"

### 4. Crear credenciales OAuth2
- Ve a "APIs & Services" > "Credentials"
- Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
- Selecciona "Web application"
- Agrega estos URIs de redirección:
  - `http://localhost:3002/api/google/oauth-callback`
  - `http://localhost:3000/api/google/oauth-callback` (para el frontend)

### 5. Copiar las credenciales
- Copia el "Client ID" y "Client Secret"
- Pégalos en tu archivo `.env`

## Ejemplo de archivo .env completo:

```bash
# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_gdL38fTWHYsa@ep-jolly-mud-a8o9mqgz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Configuration
JWT_SECRET=supersecreto123

# Server Configuration
NODE_ENV=development
PORT=3002

# Google Calendar Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback

# WhatsApp Configuration (Twilio)
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Facturación Configuration
FACTURACION_URL=https://api.facturacion.ejemplo.com
FACTURACION_API_KEY=your_facturacion_api_key_here
FACTURACION_CLIENT_ID=procura_clinic
FACTURACION_WEBHOOK_URL=https://tu-dominio.com/api/facturacion/webhook
```

## Verificación

Una vez configuradas las variables, reinicia el backend:

```bash
cd modulosjuntos/backend
npm run dev
```

Y prueba el endpoint:
```bash
curl http://localhost:3002/api/google/oauth-init
```

## Notas importantes:

1. **Nunca compartas tus credenciales** - El archivo `.env` debe estar en `.gitignore`
2. **URIs de redirección** - Asegúrate de que coincidan exactamente
3. **Dominio de producción** - Cuando despliegues a producción, actualiza las URIs de redirección
4. **Permisos** - La API de Google Calendar requiere permisos específicos para leer/escribir eventos

## Endpoints disponibles:

- `GET /api/google/oauth-init` - Iniciar autenticación
- `GET /api/google/oauth-callback` - Callback de Google
- `GET /api/google/status` - Estado de conexión
- `POST /api/google/disconnect` - Desconectar
- `GET /api/google/events` - Obtener eventos
- `POST /api/google/events` - Crear evento
- `PUT /api/google/events/:eventId` - Actualizar evento
- `DELETE /api/google/events/:eventId` - Eliminar evento















