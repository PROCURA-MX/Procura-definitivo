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
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
// Configuración centralizada para NimbusLabs
const NIMBUS_CONFIG = {
    baseUrl: 'https://testcfdi.nimbuslabs.mx',
    credentials: {
        username: 'DemoTicket',
        password: 'D3m0T1ck3t++'
    },
    endpoints: {
        login: '/tickets/api/Login/Login',
        createTicket: '/tickets/api/Tickets/Ticket'
    },
    retryAttempts: 3,
    timeout: 10000 // 10 segundos
};
// Clase para manejar la integración con NimbusLabs
class NimbusLabsService {
    constructor() {
        this.token = null;
        this.tokenExpiry = 0;
    }
    /**
     * Obtiene un token válido, renovándolo si es necesario
     */
    async getValidToken() {
        const now = Date.now();
        // Si el token existe y no ha expirado, lo retornamos
        if (this.token && now < this.tokenExpiry) {
            return this.token;
        }
        // Renovamos el token
        return this.refreshToken();
    }
    /**
     * Renueva el token de autenticación
     */
    async refreshToken() {
        try {
            console.log('🔄 Renovando token de NimbusLabs...');
            const response = await fetch(`${NIMBUS_CONFIG.baseUrl}${NIMBUS_CONFIG.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Usr: NIMBUS_CONFIG.credentials.username,
                    Pass: NIMBUS_CONFIG.credentials.password
                }),
                signal: AbortSignal.timeout(NIMBUS_CONFIG.timeout)
            });
            if (!response.ok) {
                throw new Error(`Error en login: ${response.status} ${response.statusText}`);
            }
            const token = await response.text();
            if (!token || token.trim() === '') {
                throw new Error('Token vacío recibido de NimbusLabs');
            }
            // Guardamos el token y establecemos expiración (1 hora)
            this.token = token;
            this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hora
            console.log('✅ Token renovado exitosamente');
            return token;
        }
        catch (error) {
            console.error('❌ Error renovando token:', error);
            this.token = null;
            this.tokenExpiry = 0;
            throw error;
        }
    }
    /**
     * Crea un ticket con reintentos automáticos
     */
    async createTicket(ticketData) {
        let lastError = null;
        for (let attempt = 1; attempt <= NIMBUS_CONFIG.retryAttempts; attempt++) {
            try {
                console.log(`🎫 Intento ${attempt}/${NIMBUS_CONFIG.retryAttempts} - Creando ticket...`);
                const token = await this.getValidToken();
                const response = await fetch(`${NIMBUS_CONFIG.baseUrl}${NIMBUS_CONFIG.endpoints.createTicket}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(ticketData),
                    signal: AbortSignal.timeout(NIMBUS_CONFIG.timeout)
                });
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                }
                const result = await response.json();
                console.log(`✅ Ticket creado exitosamente en intento ${attempt}`);
                // Manejar códigos específicos de NimbusLabs
                const codigo = result.code || result;
                let success = true;
                let message = 'Ticket creado exitosamente';
                // Códigos de error específicos de NimbusLabs
                if (codigo === -5) {
                    success = false;
                    message = 'Error en datos del ticket (código -5)';
                }
                else if (codigo === -3) {
                    success = false;
                    message = 'Desajuste en totales (código -3)';
                }
                else if (codigo === -2) {
                    success = false;
                    message = 'Error al guardar ticket (código -2)';
                }
                else if (codigo !== 1) {
                    success = false;
                    message = `Error desconocido (código ${codigo})`;
                }
                return {
                    success,
                    codigo,
                    data: result,
                    attempt,
                    message
                };
            }
            catch (error) {
                lastError = error;
                console.error(`❌ Intento ${attempt} falló:`, error);
                // Si es el último intento, no esperamos
                if (attempt < NIMBUS_CONFIG.retryAttempts) {
                    const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
                    console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        // Todos los intentos fallaron
        throw new Error(`Fallaron todos los ${NIMBUS_CONFIG.retryAttempts} intentos. Último error: ${lastError?.message}`);
    }
}
// Instancia singleton del servicio
const nimbusService = new NimbusLabsService();
// Ruta para autenticación con el proveedor de facturación
router.post('/auth', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { client_id } = req.body;
        // Aquí se implementaría la lógica de autenticación con el proveedor
        // Por ahora retornamos un token de ejemplo
        const token = `token_${client_id}_${Date.now()}`;
        res.json({
            success: true,
            token,
            expires_in: 3600 // 1 hora
        });
    }
    catch (error) {
        console.error('Error en autenticación de facturación:', error);
        res.status(500).json({
            success: false,
            message: 'Error en autenticación'
        });
    }
}));
// Ruta para sincronización de datos
router.post('/sync', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Aquí se implementaría la sincronización de datos con el proveedor
        // Por ejemplo, enviar pacientes, servicios, etc.
        res.json({
            success: true,
            message: 'Datos sincronizados correctamente'
        });
    }
    catch (error) {
        console.error('Error en sincronización:', error);
        res.status(500).json({
            success: false,
            message: 'Error en sincronización'
        });
    }
}));
// Ruta para webhook del proveedor
router.post('/webhook', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { event, data } = req.body;
        // Aquí se procesarían los eventos del proveedor
        // Por ejemplo, cuando se crea una factura, se cancela, etc.
        console.log('Webhook recibido:', { event, data });
        res.json({
            success: true,
            message: 'Webhook procesado'
        });
    }
    catch (error) {
        console.error('Error procesando webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando webhook'
        });
    }
}));
// Ruta para obtener configuración
router.get('/config', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const config = {
            portalUrl: process.env.FACTURACION_URL || 'https://portal-facturacion.ejemplo.com',
            clientId: process.env.FACTURACION_CLIENT_ID || 'procura_clinic',
            webhookUrl: process.env.FACTURACION_WEBHOOK_URL || ''
        };
        res.json({
            success: true,
            config
        });
    }
    catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo configuración'
        });
    }
}));
// Ruta robusta para crear tickets en NimbusLabs
router.post('/create-ticket', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const ticketData = req.body;
        console.log('🔄 Recibiendo ticket del frontend:', JSON.stringify(ticketData, null, 2));
        // Validación básica de datos
        if (!ticketData || !ticketData.Fecha || !ticketData.MontoTicket || !ticketData.NumTicket) {
            return res.status(400).json({
                success: false,
                codigo: -1,
                message: 'Datos del ticket incompletos o inválidos'
            });
        }
        // Crear ticket con el servicio robusto
        const result = await nimbusService.createTicket(ticketData);
        console.log('✅ Ticket procesado exitosamente:', result);
        // ✅ NUEVO: Enviar factura por email si el ticket se creó exitosamente
        if (result.success && ticketData.pacienteEmail && ticketData.pacienteNombre) {
            try {
                console.log('📧 Enviando factura por email al paciente...');
                // Importar EmailService dinámicamente para evitar dependencias circulares
                const { EmailService } = await Promise.resolve().then(() => __importStar(require('../services/emailService')));
                const emailResult = await EmailService.sendInvoiceEmail({
                    pacienteNombre: ticketData.pacienteNombre,
                    pacienteEmail: ticketData.pacienteEmail,
                    folio: ticketData.NumTicket,
                    monto: ticketData.MontoTicket,
                    conceptos: ticketData.Conceptos?.map((concepto) => ({
                        descripcion: concepto.Descripcion || 'Servicio Médico',
                        cantidad: concepto.Cantidad || 1,
                        precioUnitario: concepto.PrecioUnitario || 0,
                        importe: concepto.Importe || 0
                    })) || [],
                    fecha: ticketData.Fecha,
                    usuarioId: req.user?.id || 'system',
                    pacienteId: ticketData.pacienteId || 'unknown',
                    cobroId: ticketData.cobroId || 'unknown',
                    portalUrl: `https://testcfdi.nimbuslabs.mx/Autofactura/autofactura/IndexTicket`
                });
                if (emailResult.success) {
                    console.log('✅ Factura enviada por email exitosamente');
                }
                else {
                    console.error('❌ Error enviando factura por email:', emailResult.error);
                }
            }
            catch (emailError) {
                console.error('❌ Error crítico enviando factura por email:', emailError);
                // No fallar el proceso principal si el email falla
            }
        }
        res.json({
            success: result.success,
            codigo: result.codigo,
            message: result.message,
            data: result.data,
            metadata: {
                attempts: result.attempt,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('❌ Error crítico en create-ticket:', error);
        // Determinar el tipo de error para mejor respuesta
        let errorCode = -1;
        let errorMessage = 'Error desconocido';
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                errorCode = -2;
                errorMessage = 'Timeout en la comunicación con NimbusLabs';
            }
            else if (error.message.includes('401') || error.message.includes('403')) {
                errorCode = -3;
                errorMessage = 'Error de autenticación con NimbusLabs';
            }
            else if (error.message.includes('500')) {
                errorCode = -4;
                errorMessage = 'Error interno en NimbusLabs';
            }
            else {
                errorMessage = error.message;
            }
        }
        res.status(500).json({
            success: false,
            codigo: errorCode,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
}));
exports.default = router;
