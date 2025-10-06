import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pacienteRoutes from './routes/pacienteRoutes';
import cobroRoutes from './routes/cobroRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import consultorioRoutes from './routes/consultorioRoutes';
import precioConsultorioRoutes from './routes/precioConsultorioRoutes';
import cobroConceptoRoutes from './routes/cobroConceptoRoutes';
import historialCobroRoutes from './routes/historialCobroRoutes';
import historialRoutes from './routes/historialRoutes';
import servicioRoutes from './routes/servicioRoutes';
import organizacionRoutes from './routes/organizacionRoutes';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { inventoryRoutes } from './routes/inventoryRoutes';
import permisosRoutes from './routes/permisosRoutes';
import citaRoutes from './routes/citaRoutes';
import disponibilidadMedicoRoutes from './routes/disponibilidadMedicoRoutes'
import bloqueoMedicoRoutes from './routes/bloqueoMedicoRoutes'
import googleAuthRoutes from './routes/googleAuthRoutes'
// import googleCalendarRoutes from './routes/googleCalendarSimple' // Comentado - usando googleAuthRoutes en su lugar
import whatsappRoutes from './routes/whatsappRoutes'
import metricsRoutes from './routes/metricsRoutes'
import { authenticateMultiTenant } from './middleware/tenantMiddleware'
import { connectionLimiterMiddleware } from './middleware/connectionLimiter'
import { cacheMiddleware } from './utils/smartCache'
import prisma from './prisma'
import monitoringService from './services/monitoringService'
import immunotherapyRoutes from './routes/immunotherapyRoutes';
import eventRoutes from './routes/eventRoutes';
import facturacionRoutes from './routes/facturacionRoutes';
dotenv.config();

console.log("Iniciando backend optimizado para producción...");

// Manejo global de errores no capturados
process.on('uncaughtException', function (err: Error) {
  console.error('🚨 Excepción no capturada:', err);
});

process.on('unhandledRejection', function (err: any) {
  console.error('🚨 Promesa no manejada:', err);
});

const app: Application = express();

// SECURIDAD: Helmet para headers de seguridad
app.use(helmet({
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
app.use(compression());

// RATE LIMITING: Proteger contra ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  message: {
    error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
  },
  skipSuccessfulRequests: true,
});

// Rate limiting ULTRA ESTRICTO para rutas críticas
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // 30 requests/min en producción
  message: {
    error: 'Demasiadas peticiones a rutas críticas, intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para búsquedas (más permisivo pero controlado)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 60 : 200, // 60 búsquedas/min en producción
  message: {
    error: 'Demasiadas búsquedas, espera un momento'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// APLICAR RATE LIMITING ESTRATIFICADO POR CRITICIDAD

// Rutas CRÍTICAS - Rate limiting ultra estricto
app.use('/api/usuarios', strictLimiter);
app.use('/api/consultorios', strictLimiter);
app.use('/api/cobros', strictLimiter);
app.use('/api/inventory', strictLimiter);

// Rutas de BÚSQUEDA - Rate limiting específico para búsquedas
app.use('/api/pacientes/search', searchLimiter);

// Rutas NORMALES - Rate limiting estándar
app.use('/api/pacientes', limiter);
app.use('/api/servicios', limiter);
app.use('/api/citas', limiter);
app.use('/api/precios-consultorio', limiter);
app.use('/api/cobro-conceptos', limiter);
app.use('/api/historial-cobros', limiter);
app.use('/api/historial', limiter);
app.use('/api/organizaciones', limiter);
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
function authenticateJWT(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
      }
      (req as any).user = user;
      next();
    });
  } else {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
}

// CORS seguro
app.use(cors({
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
app.options('*', cors());

app.use(express.json());

// 🚀 PROTECCIONES ANTI-SATURACIÓN
// 1. Limitar conexiones simultáneas
app.use(connectionLimiterMiddleware);

// 2. Cache inteligente para rutas de lectura
app.use('/api/pacientes', cacheMiddleware(2 * 60 * 1000)); // 2 minutos
app.use('/api/consultorios', cacheMiddleware(5 * 60 * 1000)); // 5 minutos
app.use('/api/servicios', cacheMiddleware(10 * 60 * 1000)); // 10 minutos

// Configurar middleware de sesiones
app.use(session({
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
app.get('/', (req: Request, res: Response) => {
  res.send('API de ProCura Cobros funcionando');
});

// RUTAS DE AUTENTICACIÓN (deben ir primero)
app.use('/api', authRoutes);

// RUTA DIRECTA DE AUTENTICACIÓN
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }
    const user = await prisma.usuario.findUnique({ where: { email } });
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
    const userWithOrg = await prisma.$queryRaw`
      SELECT u.*, o.id as organizacion_id, o.nombre as organizacion_nombre
      FROM usuarios u
      JOIN organizaciones o ON u.organizacion_id = o.id
      WHERE u.id = ${user.id}::text
    `;
    
    const userData = (userWithOrg as any[])[0];
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        organizacion_id: userData.organizacion_id,
        organizacion_nombre: userData.organizacion_nombre
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    
    // Incluir sedeId en la respuesta del usuario
    const userResponse = {
      ...user,
      sedeId: 'sede-tecamachalco' // Valor por defecto
    };
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Health check endpoint para monitoring
app.get('/health', (req: Request, res: Response) => {
  const health = monitoringService.getHealthCheck();
  res.json(health);
});

// Endpoint para métricas de performance (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.get('/metrics', (req: Request, res: Response) => {
    res.json({
      performance: monitoringService.getPerformanceStats(),
      errors: monitoringService.getErrorStats()
    });
  });
}

// Rutas con autenticación multi-tenant (filtrado por organización/consultorio)
app.use('/api/pacientes', authenticateMultiTenant, pacienteRoutes);
app.use('/api/usuarios', authenticateMultiTenant, usuarioRoutes);
app.use('/api/consultorios', authenticateMultiTenant, consultorioRoutes);
app.use('/api/servicios', authenticateMultiTenant, servicioRoutes);
app.use('/api/citas', authenticateMultiTenant, citaRoutes);
app.use('/api/permisos', authenticateMultiTenant, permisosRoutes);

// Rutas de conceptos de cobro con autenticación multi-tenant
app.use('/api/cobro-conceptos', authenticateMultiTenant, cobroConceptoRoutes);

// Rutas de cobros con autenticación multi-tenant
app.use('/api/cobros', authenticateMultiTenant, cobroRoutes);

// Rutas con autenticación JWT básico (no necesitan filtrado)
app.use('/api/precios-consultorio', precioConsultorioRoutes);
app.use('/api/historial-cobros', historialCobroRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/organizaciones', organizacionRoutes);

// Endpoint público para debug de consultorios-sedes (sin autenticación)
app.get('/api/debug/consultorios-sedes', async (req, res) => {
  try {
    console.log('🔍 Endpoint DEBUG público /api/debug/consultorios-sedes llamado');
    
    // Obtener todas las sedes dinámicamente desde la base de datos
    const sedes = await prisma.sede.findMany({
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
    const consultorioSedeMapping: { [key: string]: string } = {
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
  } catch (error) {
    console.error('Error obteniendo mapeo consultorio-sede:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas de inventario con autenticación multi-tenant
app.use('/api/inventory', authenticateMultiTenant, inventoryRoutes);
app.use('/api/immunotherapy', authenticateMultiTenant, immunotherapyRoutes);

// Agregar rutas de eventos
app.use('/api/events', eventRoutes);
app.use('/api/facturacion', authenticateMultiTenant, facturacionRoutes);

// 🎯 ALIAS PARA COMPATIBILIDAD: Endpoint de log de inmunoterapia
app.get('/api/immunotherapy-log/:pacienteId', authenticateMultiTenant, async (req: Request, res: Response) => {
  try {
    const { pacienteId } = req.params;
    const organizacionId = (req as any).organizationId;
    
    if (!organizacionId) {
      return res.status(400).json({
        success: false,
        error: 'organizacionId es requerido'
      });
    }

    // Importar el servicio dinámicamente para evitar dependencias circulares
    const { ImmunotherapyService } = await import('./services/immunotherapyService');
    const immunotherapyService = ImmunotherapyService.getInstance();
    
    const log = await immunotherapyService.getImmunotherapyLog(pacienteId, organizacionId);

    return res.json({
      success: true,
      data: log
    });

  } catch (error) {
    console.error('❌ Error en immunotherapy-log:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Rutas de permisos - YA REGISTRADO ARRIBA CON MIDDLEWARE

app.use('/api/disponibilidad-medico', disponibilidadMedicoRoutes)
app.use('/api/bloqueo-medico', bloqueoMedicoRoutes)

// Ruta específica para status de Google Calendar con autenticación multi-tenant
app.get('/api/google/status', authenticateMultiTenant, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleCalendarId: true
      }
    })

    if (!usuario?.googleAccessToken) {
      return res.json({ 
        connected: false, 
        message: 'No conectado a Google Calendar' 
      })
    }

    // Verificar si el token ha expirado
    const isExpired = usuario.googleTokenExpiry && 
                     new Date() > usuario.googleTokenExpiry

    return res.json({
      connected: true,
      hasRefreshToken: !!usuario.googleRefreshToken,
      isExpired,
      calendarId: usuario.googleCalendarId
    })

  } catch (error) {
    console.error('Error verificando estado:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
});

// Rutas de Google Calendar
app.use('/api/google', authenticateMultiTenant, googleAuthRoutes);
// app.use('/api/google', googleCalendarRoutes); // Comentado - usando googleAuthRoutes en su lugar

// Rutas de WhatsApp
app.use('/api/whatsapp', whatsappRoutes);

// Rutas de métricas (sin autenticación para monitoreo)
app.use('/api/metrics', metricsRoutes);

// Rutas para manejar callbacks de OAuth
app.get('/sincronizacion-exitosa', (req: Request, res: Response) => {
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

app.get('/sincronizacion-error', (req: Request, res: Response) => {
  const error = req.query.error as string;
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

const PORT: number = parseInt(process.env.PORT || '3002', 10);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
}

export default app;