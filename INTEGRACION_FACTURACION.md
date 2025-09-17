# Integración con Proveedor de Facturación

## Descripción

Este módulo proporciona integración con un proveedor de servicios de facturación externo. Los usuarios pueden acceder al portal del proveedor directamente desde la aplicación para gestionar facturas, clientes y configuraciones fiscales.

## Características

- ✅ **Acceso directo al portal**: Redirección a nueva ventana
- ✅ **Configuración flexible**: Variables de entorno para personalización
- ✅ **Autenticación segura**: Tokens de acceso temporales
- ✅ **Sincronización de datos**: Envío de información del sistema
- ✅ **Webhooks**: Recepción de eventos del proveedor
- ✅ **Validación de configuración**: Verificación de credenciales

## Configuración

### Variables de Entorno Frontend

Agregar al archivo `.env` del frontend:

```env
# Configuración del Proveedor de Facturación
REACT_APP_FACTURACION_URL=https://portal-facturacion.ejemplo.com
REACT_APP_FACTURACION_API_KEY=tu_api_key_aqui
REACT_APP_FACTURACION_CLIENT_ID=procura_clinic
REACT_APP_FACTURACION_WEBHOOK_URL=https://tu-dominio.com/api/facturacion/webhook
```

### Variables de Entorno Backend

Agregar al archivo `.env` del backend:

```env
# Configuración del Proveedor de Facturación
FACTURACION_URL=https://portal-facturacion.ejemplo.com
FACTURACION_API_KEY=tu_api_key_aqui
FACTURACION_CLIENT_ID=procura_clinic
FACTURACION_WEBHOOK_URL=https://tu-dominio.com/api/facturacion/webhook
```

## Uso

### Acceso al Portal

1. Navegar a "Facturación" en la sidebar
2. Hacer clic en "Ir al Portal de Facturación"
3. Se abrirá una nueva ventana con el portal del proveedor

### Integración con Datos

El sistema puede enviar datos específicos al portal:

```typescript
import facturacionService from '@/services/facturacionService';

const facturaData = {
  pacienteId: '123',
  pacienteNombre: 'Juan Pérez',
  pacienteRfc: 'XAXX010101000',
  monto: 1500.00,
  concepto: 'Consulta médica',
  fecha: '2024-01-15',
  metodoPago: 'Tarjeta'
};

facturacionService.openPortalWithData(facturaData);
```

## API Endpoints

### Autenticación
- `POST /api/facturacion/auth` - Genera token de acceso

### Sincronización
- `POST /api/facturacion/sync` - Sincroniza datos con el proveedor

### Webhooks
- `POST /api/facturacion/webhook` - Recibe eventos del proveedor

### Configuración
- `GET /api/facturacion/config` - Obtiene configuración actual

## Estructura de Archivos

```
frontend/
├── src/
│   ├── pages/
│   │   └── Facturacion.tsx          # Página principal del módulo
│   └── services/
│       └── facturacionService.ts    # Servicio de integración

backend/
├── routes/
│   └── facturacionRoutes.ts         # Rutas de la API
└── index.ts                         # Configuración de rutas
```

## Flujo de Integración

1. **Configuración**: El sistema verifica las credenciales del proveedor
2. **Autenticación**: Se genera un token temporal para el acceso
3. **Redirección**: El usuario es enviado al portal del proveedor
4. **Gestión**: El usuario gestiona facturas en el portal externo
5. **Webhooks**: El proveedor envía eventos de vuelta al sistema
6. **Sincronización**: Los datos se sincronizan entre ambos sistemas

## Seguridad

- ✅ Tokens temporales con expiración
- ✅ Validación de origen en webhooks
- ✅ Configuración mediante variables de entorno
- ✅ Acceso en nueva ventana (no afecta la sesión principal)

## Próximos Pasos

- [ ] Implementar autenticación real con el proveedor
- [ ] Agregar sincronización bidireccional de datos
- [ ] Implementar notificaciones de eventos
- [ ] Agregar reportes de facturación
- [ ] Integrar con el módulo de cobros existente

## Notas

- El módulo actual es una base para la integración
- Se requiere configuración específica del proveedor elegido
- Los webhooks deben ser configurados en el portal del proveedor
- La sincronización de datos debe ser implementada según las necesidades específicas 