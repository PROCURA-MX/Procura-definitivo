# Configuración de Google Calendar

## Variables de entorno necesarias

Agrega estas variables a tu archivo `.env`:

```bash
# Google Calendar Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback
```

## Pasos para configurar Google Calendar:

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/
2. **Crear un nuevo proyecto** o seleccionar uno existente
3. **Habilitar la API de Google Calendar**:
   - Ir a "APIs & Services" > "Library"
   - Buscar "Google Calendar API"
   - Hacer clic en "Enable"
4. **Crear credenciales OAuth2**:
   - Ir a "APIs & Services" > "Credentials"
   - Hacer clic en "Create Credentials" > "OAuth 2.0 Client IDs"
   - Seleccionar "Web application"
   - Agregar URI de redirección: `http://localhost:3002/api/google/oauth-callback`
5. **Copiar Client ID y Client Secret** al archivo `.env`

## Endpoints disponibles:

- `GET /api/google/oauth-init` - Iniciar autenticación
- `GET /api/google/oauth-callback` - Callback de Google
- `GET /api/google/connection-status` - Verificar estado de conexión
- `POST /api/google/disconnect` - Desconectar Google Calendar
- `POST /api/google/sync-citas` - Sincronizar citas
- `GET /api/google/events` - Obtener eventos de Google Calendar















