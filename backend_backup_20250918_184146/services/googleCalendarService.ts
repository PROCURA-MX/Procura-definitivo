import axios from 'axios'
import prisma from '../prisma'

interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

interface RefreshTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// Cache simple para evitar requests repetidos
const requestCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Rate limiting simple
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests por minuto
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto

class GoogleCalendarService {
  private async checkRateLimit(userId: string): Promise<boolean> {
    const now = Date.now()
    const userLimit = rateLimitMap.get(userId)
    
    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return true
    }
    
    if (userLimit.count >= RATE_LIMIT) {
      return false
    }
    
    userLimit.count++
    return true
  }

  private async getCachedRequest(key: string): Promise<any | null> {
    const cached = requestCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCachedRequest(key: string, data: any): void {
    requestCache.set(key, { data, timestamp: Date.now() })
  }

  private async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiry: true
        }
      })

      if (!usuario?.googleAccessToken) {
        console.log(`Usuario ${userId} no tiene tokens de Google`)
        return null
      }

      // Verificar si el token ha expirado o está por expirar (dentro de 5 minutos)
      const now = new Date()
      const expiryTime = usuario.googleTokenExpiry ? new Date(usuario.googleTokenExpiry) : null
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
      
      const isExpired = expiryTime && now > expiryTime
      const isExpiringSoon = expiryTime && expiryTime < fiveMinutesFromNow

      if ((isExpired || isExpiringSoon) && usuario.googleRefreshToken) {
        console.log(`Refrescando token para usuario ${userId} (${isExpired ? 'expirado' : 'por expirar'})`)
        
        const response = await axios.post<RefreshTokenResponse>(
          'https://oauth2.googleapis.com/token',
          null,
          {
            params: {
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              refresh_token: usuario.googleRefreshToken,
              grant_type: 'refresh_token'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        )

        const { access_token, expires_in } = response.data

        // Actualizar el token en la base de datos
        await prisma.usuario.update({
          where: { id: userId },
          data: {
            googleAccessToken: access_token,
            googleTokenExpiry: new Date(Date.now() + (expires_in * 1000))
          }
        })

        console.log(`Token refrescado para usuario ${userId}, nuevo expiry: ${new Date(Date.now() + (expires_in * 1000))}`)
        return access_token
      }

      return usuario.googleAccessToken
    } catch (error) {
      console.error(`Error refrescando token para usuario ${userId}:`, error)
      
      // Si el refresh token es inválido, limpiar los tokens
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        console.log(`Refresh token inválido para usuario ${userId}, limpiando tokens`)
        await prisma.usuario.update({
          where: { id: userId },
          data: {
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiry: null
          }
        })
      }
      
      return null
    }
  }

  async createEvent(userId: string, eventData: GoogleCalendarEvent): Promise<string | null> {
    try {
      // Verificar rate limit
      if (!(await this.checkRateLimit(userId))) {
        console.warn(`Rate limit excedido para usuario ${userId}`)
        return null
      }

      const accessToken = await this.refreshTokenIfNeeded(userId)
      if (!accessToken) {
        console.log(`No se pudo obtener token válido para usuario ${userId}`)
        return null
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { googleCalendarId: true }
      })

      const calendarId = usuario?.googleCalendarId || 'primary'

      const response = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        eventData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log(`Evento creado en Google Calendar para usuario ${userId}: ${response.data.id}`)
      return response.data.id
    } catch (error) {
      console.error(`Error creando evento en Google Calendar para usuario ${userId}:`, error)
      if (axios.isAxiosError(error)) {
        console.error('Error de Google API:', error.response?.data)
      }
      return null
    }
  }

  async updateEvent(userId: string, googleEventId: string, eventData: GoogleCalendarEvent): Promise<boolean> {
    try {
      // Verificar rate limit
      if (!(await this.checkRateLimit(userId))) {
        console.warn(`Rate limit excedido para usuario ${userId}`)
        return false
      }

      const accessToken = await this.refreshTokenIfNeeded(userId)
      if (!accessToken) {
        console.log(`No se pudo obtener token válido para usuario ${userId}`)
        return false
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { googleCalendarId: true }
      })

      const calendarId = usuario?.googleCalendarId || 'primary'

      await axios.put(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
        eventData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log(`Evento actualizado en Google Calendar para usuario ${userId}: ${googleEventId}`)
      return true
    } catch (error) {
      console.error(`Error actualizando evento en Google Calendar para usuario ${userId}:`, error)
      if (axios.isAxiosError(error)) {
        console.error('Error de Google API:', error.response?.data)
      }
      return false
    }
  }

  async deleteEvent(userId: string, googleEventId: string): Promise<boolean> {
    try {
      // Verificar rate limit
      if (!(await this.checkRateLimit(userId))) {
        console.warn(`Rate limit excedido para usuario ${userId}`)
        return false
      }

      const accessToken = await this.refreshTokenIfNeeded(userId)
      if (!accessToken) {
        console.log(`No se pudo obtener token válido para usuario ${userId}`)
        return false
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { googleCalendarId: true }
      })

      const calendarId = usuario?.googleCalendarId || 'primary'

      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      console.log(`Evento eliminado en Google Calendar para usuario ${userId}: ${googleEventId}`)
      return true
    } catch (error) {
      console.error(`Error eliminando evento en Google Calendar para usuario ${userId}:`, error)
      if (axios.isAxiosError(error)) {
        console.error('Error de Google API:', error.response?.data)
      }
      return false
    }
  }

  convertCitaToGoogleEvent(cita: any, paciente: any, usuario: any): GoogleCalendarEvent {
    const summary = `Cita: ${paciente.nombre} ${paciente.apellido}`
    const description = `Paciente: ${paciente.nombre} ${paciente.apellido}\nTeléfono: ${paciente.telefono || 'No disponible'}\nEmail: ${paciente.email || 'No disponible'}\nDoctor: ${usuario.nombre} ${usuario.apellido}`
    
    return {
      summary,
      description,
      start: {
        dateTime: new Date(cita.fecha_inicio).toISOString(),
        timeZone: 'America/Mexico_City'
      },
      end: {
        dateTime: new Date(cita.fecha_fin).toISOString(),
        timeZone: 'America/Mexico_City'
      },
      attendees: [
        {
          email: usuario.email,
          displayName: `${usuario.nombre} ${usuario.apellido}`
        }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: 15
          },
          {
            method: 'email',
            minutes: 60
          }
        ]
      }
    }
  }

  async isUserConnected(userId: string): Promise<boolean> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiry: true
        }
      })

      if (!usuario?.googleAccessToken) {
        return false
      }

      // Verificar si el token ha expirado
      const isExpired = usuario.googleTokenExpiry && 
                       new Date() > usuario.googleTokenExpiry

      // Si está expirado pero tiene refresh token, considerarlo conectado
      return isExpired ? !!usuario.googleRefreshToken : true
    } catch (error) {
      console.error(`Error verificando conexión de usuario ${userId}:`, error)
      return false
    }
  }
}

export default new GoogleCalendarService() 