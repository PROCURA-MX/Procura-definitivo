"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pacienteRoutes_1 = __importDefault(require("./routes/pacienteRoutes"));
const cobroRoutes_1 = __importDefault(require("./routes/cobroRoutes"));
const usuarioRoutes_1 = __importDefault(require("./routes/usuarioRoutes"));
const consultorioRoutes_1 = __importDefault(require("./routes/consultorioRoutes"));
const precioConsultorioRoutes_1 = __importDefault(require("./routes/precioConsultorioRoutes"));
const cobroConceptoRoutes_1 = __importDefault(require("./routes/cobroConceptoRoutes"));
const historialCobroRoutes_1 = __importDefault(require("./routes/historialCobroRoutes"));
const historialRoutes_1 = __importDefault(require("./routes/historialRoutes"));
const servicioRoutes_1 = __importDefault(require("./routes/servicioRoutes"));
const organizacionRoutes_1 = __importDefault(require("./routes/organizacionRoutes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const inventoryRoutes_1 = require("./routes/inventoryRoutes");
const permisosRoutes_1 = __importDefault(require("./routes/permisosRoutes"));
const citaRoutes_1 = __importDefault(require("./routes/citaRoutes"));
const disponibilidadMedicoRoutes_1 = __importDefault(require("./routes/disponibilidadMedicoRoutes"));
const bloqueoMedicoRoutes_1 = __importDefault(require("./routes/bloqueoMedicoRoutes"));
const googleAuthRoutes_1 = __importDefault(require("./routes/googleAuthRoutes"));
// import googleCalendarRoutes from './routes/googleCalendarSimple' // Comentado - usando googleAuthRoutes en su lugar
const whatsappRoutes_1 = __importDefault(require("./routes/whatsappRoutes"));
const tenantMiddleware_1 = require("./middleware/tenantMiddleware");
const prisma_1 = __importDefault(require("./prisma"));
const monitoringService_1 = __importDefault(require("./services/monitoringService"));
const immunotherapyRoutes_1 = __importDefault(require("./routes/immunotherapyRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const facturacionRoutes_1 = __importDefault(require("./routes/facturacionRoutes"));
dotenv_1.default.config();
console.log("Iniciando backend optimizado para producción...");
// Manejo global de errores no capturados
process.on('uncaughtException', function (err) {
    console.error('🚨 Excepción no capturada:', err);
});
process.on('unhandledRejection', function (err) {
    console.error('🚨 Promesa no manejada:', err);
});
const app = (0, express_1.default)();
// SECURIDAD: Helmet para headers de seguridad
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// COMPRESIÓN: Comprimir todas las respuestas
app.use((0, compression_1.default)());
// RATE LIMITING: Proteger contra ataques de fuerza bruta
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiting más estricto para autenticación
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: process.env.NODE_ENV === 'production' ? 5 : 50,
    message: {
        error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
    },
    skipSuccessfulRequests: true,
});
// SOLUCIÓN SIMPLIFICADA: Aplicar rate limiting solo a rutas específicas
app.use('/api/pacientes', limiter);
app.use('/api/usuarios', limiter);
app.use('/api/consultorios', limiter);
app.use('/api/servicios', limiter);
app.use('/api/citas', limiter);
app.use('/api/cobros', limiter);
app.use('/api/precios-consultorio', limiter);
app.use('/api/cobro-conceptos', limiter);
app.use('/api/historial-cobros', limiter);
app.use('/api/historial', limiter);
app.use('/api/organizaciones', limiter);
app.use('/api/inventory', limiter);
app.use('/api/immunotherapy', limiter);
app.use('/api/disponibilidad-medico', limiter);
app.use('/api/bloqueo-medico', limiter);
// Función para limpiar rate limiting (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.get('/api/reset-rate-limit', (req, res) => {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        limiter.resetKey(clientIP);
        authLimiter.resetKey(clientIP);
        res.json({ message: 'Rate limiting reset for this IP' });
    });
}
// Log global de todas las peticiones entrantes (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log('📥 PETICIÓN:', req.method, req.url, new Date().toISOString());
        next();
    });
}
// Middleware de autenticación JWT básico
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Token inválido o expirado' });
            }
            req.user = user;
            next();
        });
    }
    else {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
}
// CORS seguro
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173', // frontend Vite
        'http://localhost:3000', // posible otro frontend
        'http://localhost:3001', // posible otro frontend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Permitir preflight OPTIONS para todas las rutas
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
// Configurar middleware de sesiones
app.use((0, express_session_1.default)({
    secret: process.env.JWT_SECRET || 'supersecreto123',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // En desarrollo
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de ProCura Cobros funcionando');
});
// RUTAS DE AUTENTICACIÓN (deben ir primero)
app.use('/api', authRoutes_1.default);
// RUTA DIRECTA DE AUTENTICACIÓN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({ error: 'Email y contraseña requeridos' });
            return;
        }
        const user = await prisma_1.default.usuario.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Usuario no encontrado' });
            return;
        }
        // Para pruebas, password fijo
        if (password !== '123456') {
            res.status(401).json({ error: 'Contraseña incorrecta' });
            return;
        }
        // Obtener la organización del usuario
        const userWithOrg = await prisma_1.default.$queryRaw `
      SELECT u.*, o.id as organizacion_id, o.nombre as organizacion_nombre
      FROM usuarios u
      JOIN organizaciones o ON u.organizacion_id = o.id
      WHERE u.id = ${user.id}::text
    `;
        const userData = userWithOrg[0];
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            rol: user.rol,
            organizacion_id: userData.organizacion_id,
            organizacion_nombre: userData.organizacion_nombre
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Incluir sedeId en la respuesta del usuario
        const userResponse = {
            ...user,
            sedeId: 'sede-tecamachalco' // Valor por defecto
        };
        res.json({ token, user: userResponse });
    }
    catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Health check endpoint para monitoring
app.get('/health', (req, res) => {
    const health = monitoringService_1.default.getHealthCheck();
    res.json(health);
});
// Endpoint para métricas de performance (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.get('/metrics', (req, res) => {
        res.json({
            performance: monitoringService_1.default.getPerformanceStats(),
            errors: monitoringService_1.default.getErrorStats()
        });
    });
}
// Rutas con autenticación multi-tenant (filtrado por organización/consultorio)
app.use('/api/pacientes', tenantMiddleware_1.authenticateMultiTenant, pacienteRoutes_1.default);
app.use('/api/usuarios', tenantMiddleware_1.authenticateMultiTenant, usuarioRoutes_1.default);
app.use('/api/consultorios', tenantMiddleware_1.authenticateMultiTenant, consultorioRoutes_1.default);
app.use('/api/servicios', tenantMiddleware_1.authenticateMultiTenant, servicioRoutes_1.default);
app.use('/api/citas', tenantMiddleware_1.authenticateMultiTenant, citaRoutes_1.default);
app.use('/api/permisos', tenantMiddleware_1.authenticateMultiTenant, permisosRoutes_1.default);
// Rutas de conceptos de cobro con autenticación multi-tenant
app.use('/api/cobro-conceptos', tenantMiddleware_1.authenticateMultiTenant, cobroConceptoRoutes_1.default);
// Rutas de cobros con autenticación multi-tenant
app.use('/api/cobros', tenantMiddleware_1.authenticateMultiTenant, cobroRoutes_1.default);
// Rutas con autenticación JWT básico (no necesitan filtrado)
app.use('/api/precios-consultorio', precioConsultorioRoutes_1.default);
app.use('/api/historial-cobros', historialCobroRoutes_1.default);
app.use('/api/historial', historialRoutes_1.default);
app.use('/api/organizaciones', organizacionRoutes_1.default);
// Endpoint público para debug de consultorios-sedes (sin autenticación)
app.get('/api/debug/consultorios-sedes', async (req, res) => {
    try {
        console.log('🔍 Endpoint DEBUG público /api/debug/consultorios-sedes llamado');
        // Obtener todas las sedes dinámicamente desde la base de datos
        const sedes = await prisma_1.default.sede.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                createdAt: true,
                updatedAt: true
            }
        });
        console.log('🔍 Sedes obtenidas de BD:', sedes);
        // Crear mapeo temporal usando sedeId como consultorioId
        const consultorioSedeMapping = {
            'todos': 'todos'
        };
        // Mapeo temporal: usar sedeId como consultorioId
        for (const sede of sedes) {
            consultorioSedeMapping[sede.id] = sede.id;
            console.log(`🔍 Mapeo temporal agregado: ${sede.id} -> ${sede.id}`);
        }
        console.log('🔍 Mapeo consultorio-sede generado (temporal):', consultorioSedeMapping);
        res.json({
            mapping: consultorioSedeMapping,
            debug: {
                sedes: sedes,
                totalSedes: sedes.length,
                message: "Mapeo temporal usando sedeId como consultorioId"
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo mapeo consultorio-sede:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Rutas de inventario con autenticación multi-tenant
app.use('/api/inventory', tenantMiddleware_1.authenticateMultiTenant, inventoryRoutes_1.inventoryRoutes);
app.use('/api/immunotherapy', tenantMiddleware_1.authenticateMultiTenant, immunotherapyRoutes_1.default);
// Agregar rutas de eventos
app.use('/api/events', eventRoutes_1.default);
app.use('/api/facturacion', tenantMiddleware_1.authenticateMultiTenant, facturacionRoutes_1.default);
// 🎯 ALIAS PARA COMPATIBILIDAD: Endpoint de log de inmunoterapia
app.get('/api/immunotherapy-log/:pacienteId', tenantMiddleware_1.authenticateMultiTenant, async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const organizacionId = req.organizationId;
        if (!organizacionId) {
            return res.status(400).json({
                success: false,
                error: 'organizacionId es requerido'
            });
        }
        // Importar el servicio dinámicamente para evitar dependencias circulares
        const { ImmunotherapyService } = await Promise.resolve().then(() => __importStar(require('./services/immunotherapyService')));
        const immunotherapyService = ImmunotherapyService.getInstance();
        const log = await immunotherapyService.getImmunotherapyLog(pacienteId, organizacionId);
        return res.json({
            success: true,
            data: log
        });
    }
    catch (error) {
        console.error('❌ Error en immunotherapy-log:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
// Rutas de permisos - YA REGISTRADO ARRIBA CON MIDDLEWARE
app.use('/api/disponibilidad-medico', disponibilidadMedicoRoutes_1.default);
app.use('/api/bloqueo-medico', bloqueoMedicoRoutes_1.default);
// Ruta específica para status de Google Calendar con autenticación multi-tenant
app.get('/api/google/status', tenantMiddleware_1.authenticateMultiTenant, async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
                googleCalendarId: true
            }
        });
        if (!usuario?.googleAccessToken) {
            return res.json({
                connected: false,
                message: 'No conectado a Google Calendar'
            });
        }
        // Verificar si el token ha expirado
        const isExpired = usuario.googleTokenExpiry &&
            new Date() > usuario.googleTokenExpiry;
        return res.json({
            connected: true,
            hasRefreshToken: !!usuario.googleRefreshToken,
            isExpired,
            calendarId: usuario.googleCalendarId
        });
    }
    catch (error) {
        console.error('Error verificando estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Rutas de Google Calendar
app.use('/api/google', tenantMiddleware_1.authenticateMultiTenant, googleAuthRoutes_1.default);
// app.use('/api/google', googleCalendarRoutes); // Comentado - usando googleAuthRoutes en su lugar
// Rutas de WhatsApp
app.use('/api/whatsapp', whatsappRoutes_1.default);
// Rutas para manejar callbacks de OAuth
app.get('/sincronizacion-exitosa', (req, res) => {
    res.send(`
    <html>
      <head><title>Sincronización Exitosa</title></head>
      <body>
        <h1>¡Sincronización con Google Calendar exitosa!</h1>
        <p>Tu cuenta ha sido conectada correctamente.</p>
        <script>
          setTimeout(() => {
            window.location.href = 'http://localhost:5173/usuarios';
          }, 3000);
        </script>
      </body>
    </html>
  `);
});
app.get('/sincronizacion-error', (req, res) => {
    const error = req.query.error;
    let errorMessage = 'Error desconocido';
    switch (error) {
        case 'google_denied':
            errorMessage = 'Google denegó la autorización';
            break;
        case 'missing_params':
            errorMessage = 'Faltan parámetros requeridos';
            break;
        case 'invalid_state':
            errorMessage = 'Error de seguridad (state inválido)';
            break;
        case 'no_token':
            errorMessage = 'No se recibió token de Google';
            break;
        case 'no_user':
            errorMessage = 'No se encontró usuario';
            break;
        case 'server_error':
            errorMessage = 'Error interno del servidor';
            break;
    }
    res.send(`
    <html>
      <head><title>Error de Sincronización</title></head>
      <body>
        <h1>Error en la sincronización</h1>
        <p>${errorMessage}</p>
        <script>
          setTimeout(() => {
            window.location.href = 'http://localhost:5173/usuarios';
          }, 5000);
        </script>
      </body>
    </html>
  `);
});
const PORT = parseInt(process.env.PORT || '3002', 10);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
exports.default = app;
