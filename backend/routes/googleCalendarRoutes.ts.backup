import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import * as jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Configuración de Google OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware de autenticación
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Iniciar autenticación OAuth2
router.get('/oauth-init', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    
    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: user.id
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error iniciando OAuth:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Callback de OAuth2
router.get('/oauth-callback', async (req: any, res: any) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Código de autorización o estado faltante' });
    }

    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Obtener información del usuario de Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Actualizar usuario en la base de datos
    const updatedUser = await prisma.usuario.update({
      where: { id: state as string },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarId: userInfo.data.email
      }
    });

    res.json({ 
      success: true, 
      message: 'Google Calendar conectado exitosamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        googleCalendarId: updatedUser.googleCalendarId
      }
    });
  } catch (error) {
    console.error('Error en callback OAuth:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar estado de conexión
router.get('/status', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    
    const isConnected = !!(user.googleAccessToken && user.googleRefreshToken);
    
    res.json({
      connected: isConnected,
      googleCalendarId: user.googleCalendarId,
      hasAccessToken: !!user.googleAccessToken,
      hasRefreshToken: !!user.googleRefreshToken
    });
  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Desconectar Google Calendar
router.post('/disconnect', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    
    // Limpiar tokens en la base de datos
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null
      }
    });

    res.json({ success: true, message: 'Google Calendar desconectado exitosamente' });
  } catch (error) {
    console.error('Error desconectando:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener eventos del calendario
router.get('/events', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    
    if (!user.googleAccessToken) {
      return res.status(400).json({ error: 'Google Calendar no está conectado' });
    }

    // Configurar cliente OAuth2
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Obtener eventos
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({ events: response.data.items || [] });
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear evento en Google Calendar
router.post('/events', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    const { title, description, start, end, location } = req.body;
    
    if (!user.googleAccessToken) {
      return res.status(400).json({ error: 'Google Calendar no está conectado' });
    }

    // Configurar cliente OAuth2
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: start,
        timeZone: 'America/Mexico_City'
      },
      end: {
        dateTime: end,
        timeZone: 'America/Mexico_City'
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    res.json({ event: response.data });
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar evento en Google Calendar
router.put('/events/:eventId', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    const { eventId } = req.params;
    const { title, description, start, end, location } = req.body;
    
    if (!user.googleAccessToken) {
      return res.status(400).json({ error: 'Google Calendar no está conectado' });
    }

    // Configurar cliente OAuth2
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: start,
        timeZone: 'America/Mexico_City'
      },
      end: {
        dateTime: end,
        timeZone: 'America/Mexico_City'
      }
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event
    });

    res.json({ event: response.data });
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar evento de Google Calendar
router.delete('/events/:eventId', authenticateUser, async (req: any, res: any) => {
  try {
    const { user } = req;
    const { eventId } = req.params;
    
    if (!user.googleAccessToken) {
      return res.status(400).json({ error: 'Google Calendar no está conectado' });
    }

    // Configurar cliente OAuth2
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    res.json({ success: true, message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;