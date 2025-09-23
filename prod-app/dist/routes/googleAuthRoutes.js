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
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../prisma"));
const crypto = __importStar(require("crypto"));
const router = express_1.default.Router();
// Middleware ya no necesario - se usa authenticateMultiTenant desde index.ts
// Generar state seguro para CSRF protection
function generateSecureState() {
    return crypto.randomBytes(32).toString('hex');
}
// Endpoint para iniciar el flujo OAuth2 con autenticación
router.post('/oauth-init', async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        console.log('🔧 OAuth Config:', { clientId, redirectUri });
        if (!clientId || !redirectUri) {
            return res.status(500).json({
                error: 'Configuración de Google OAuth incompleta'
            });
        }
        // ✅ OBTENER USER ID DEL TOKEN JWT
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token de autenticación inválido' });
        }
        // Verificar y decodificar el token JWT
        const jwt = require('jsonwebtoken');
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (jwtError) {
            console.error('Error verificando JWT:', jwtError);
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        const userId = decodedToken.id;
        if (!userId) {
            return res.status(401).json({ error: 'Token no contiene información de usuario' });
        }
        // Verificar que el usuario existe
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id: userId }
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
        // Usar el userId como state para el proceso OAuth
        const state = userId;
        console.log('🔐 OAuth init - Usuario autenticado:', {
            userId: userId,
            email: usuario.email,
            state: state
        });
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `response_type=code&` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${scope}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${state}`;
        console.log('🔗 URL de autorización generada para usuario:', userId);
        res.json({ authUrl });
    }
    catch (error) {
        console.error('❌ Error iniciando OAuth:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint para recibir el callback y guardar tokens
router.get('/oauth-callback', async (req, res) => {
    console.log('🔄 CALLBACK EJECUTÁNDOSE - Parámetros recibidos:', req.query);
    console.log('🔄 CALLBACK - URL completa:', req.url);
    try {
        const { code, state, error } = req.query;
        // Verificar si hay error de Google
        if (error) {
            console.error('❌ Error de Google OAuth:', error);
            return res.redirect('http://localhost:5173?error=google_denied');
        }
        // Validar parámetros requeridos
        if (!code || !state) {
            console.error('❌ Parámetros faltantes:', { code: !!code, state: !!state });
            return res.redirect('http://localhost:5173?error=missing_params');
        }
        console.log('✅ Parámetros recibidos correctamente:', {
            code: code.substring(0, 20) + '...',
            state: state
        });
        // Obtener tokens de Google
        console.log('🔐 Intercambiando código por tokens con Google...');
        const tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', null, {
            params: {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('✅ Respuesta de Google recibida:', {
            hasAccessToken: !!tokenResponse.data.access_token,
            hasRefreshToken: !!tokenResponse.data.refresh_token,
            expiresIn: tokenResponse.data.expires_in,
            tokenType: tokenResponse.data.token_type
        });
        const { access_token, refresh_token, expires_in, token_type } = tokenResponse.data;
        if (!access_token) {
            console.error('❌ No se recibió access_token de Google');
            return res.redirect('http://localhost:5173?error=no_token');
        }
        console.log('🔑 Access token recibido:', access_token.substring(0, 50) + '...');
        // ✅ VALIDAR Y OBTENER USUARIO DEL STATE
        let userId = state;
        // Verificar si el state es un UUID válido (ID de usuario)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            console.error('❌ State no es un UUID válido:', userId);
            return res.redirect('http://localhost:5173?error=invalid_state');
        }
        // Verificar que el usuario existe
        const user = await prisma_1.default.usuario.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true
            }
        });
        if (!user) {
            console.error('❌ Usuario no encontrado:', userId);
            return res.redirect('http://localhost:5173?error=user_not_found');
        }
        console.log('✅ Usuario encontrado:', {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido
        });
        // ✅ GUARDAR TOKENS EN LA BASE DE DATOS
        const tokenExpiry = new Date(Date.now() + (expires_in * 1000));
        await prisma_1.default.usuario.update({
            where: { id: userId },
            data: {
                googleAccessToken: access_token,
                googleRefreshToken: refresh_token || null,
                googleTokenExpiry: tokenExpiry,
                googleCalendarId: 'primary' // Por defecto usar el calendario principal
            }
        });
        console.log('✅ Tokens de Google guardados exitosamente:', {
            userId: userId,
            userEmail: user.email,
            hasAccessToken: !!access_token,
            hasRefreshToken: !!refresh_token,
            expiresAt: tokenExpiry.toISOString()
        });
        // ✅ REDIRIGIR CON ÉXITO
        res.redirect('http://localhost:5173?success=google_connected&user=' + encodeURIComponent(user.email));
    }
    catch (error) {
        console.error('❌ Error en callback OAuth:', error);
        if (axios_1.default.isAxiosError(error)) {
            console.error('❌ Error de Google API:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        }
        res.redirect('http://localhost:5173?error=server_error');
    }
});
// Endpoint para refrescar token de Google Calendar
router.post('/refresh-token', async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id: userId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true
            }
        });
        if (!usuario?.googleRefreshToken) {
            return res.status(400).json({
                error: 'No hay refresh token disponible. Necesitas reconectar con Google Calendar.'
            });
        }
        // Refrescar el token
        const response = await axios_1.default.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: usuario.googleRefreshToken,
                grant_type: 'refresh_token'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const { access_token, expires_in } = response.data;
        const newExpiry = new Date(Date.now() + (expires_in * 1000));
        // Actualizar en la base de datos
        await prisma_1.default.usuario.update({
            where: { id: userId },
            data: {
                googleAccessToken: access_token,
                googleTokenExpiry: newExpiry
            }
        });
        console.log(`Token refrescado para usuario ${userId}`);
        res.json({
            success: true,
            message: 'Token refrescado correctamente',
            expiresAt: newExpiry
        });
    }
    catch (error) {
        console.error('Error refrescando token:', error);
        if (axios_1.default.isAxiosError(error) && error.response?.status === 400) {
            // Token de refresh inválido, limpiar tokens y pedir reconexión
            await prisma_1.default.usuario.update({
                where: { id: req.user.id },
                data: {
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    googleTokenExpiry: null,
                    googleCalendarId: null
                }
            });
            return res.status(400).json({
                error: 'El refresh token ha expirado. Necesitas reconectar con Google Calendar.',
                needsReconnection: true
            });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint para desconectar Google Calendar
router.post('/disconnect', async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma_1.default.usuario.update({
            where: { id: userId },
            data: {
                googleAccessToken: null,
                googleRefreshToken: null,
                googleTokenExpiry: null,
                googleCalendarId: null
            }
        });
        res.json({
            success: true,
            message: 'Desconectado de Google Calendar'
        });
    }
    catch (error) {
        console.error('Error desconectando Google Calendar:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Endpoint para verificar el estado de conexión de Google Calendar
router.get('/status', async (req, res) => {
    try {
        // ✅ OBTENER USER ID DEL TOKEN JWT
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token de autenticación inválido' });
        }
        // Verificar y decodificar el token JWT
        const jwt = require('jsonwebtoken');
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (jwtError) {
            console.error('Error verificando JWT en status:', jwtError);
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        const userId = decodedToken.id;
        if (!userId) {
            return res.status(401).json({ error: 'Token no contiene información de usuario' });
        }
        console.log('🔍 Verificando estado de Google Calendar para usuario:', userId);
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
                googleCalendarId: true
            }
        });
        if (!usuario) {
            console.error('❌ Usuario no encontrado:', userId);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const hasAccessToken = !!usuario.googleAccessToken;
        const hasRefreshToken = !!usuario.googleRefreshToken;
        const isExpired = usuario.googleTokenExpiry ? new Date() > usuario.googleTokenExpiry : true;
        const isConnected = hasAccessToken && hasRefreshToken && !isExpired;
        console.log('📊 Estado de Google Calendar:', {
            userId: userId,
            email: usuario.email,
            hasAccessToken,
            hasRefreshToken,
            isExpired,
            isConnected,
            expiryDate: usuario.googleTokenExpiry
        });
        res.json({
            connected: isConnected,
            hasAccessToken,
            hasRefreshToken,
            isExpired,
            calendarId: usuario.googleCalendarId || '',
            message: isConnected ? 'Conectado a Google Calendar' : 'No conectado a Google Calendar',
            user: {
                id: usuario.id,
                email: usuario.email
            }
        });
    }
    catch (error) {
        console.error('❌ Error verificando estado de Google Calendar:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
exports.default = router;
