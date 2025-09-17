import axios from 'axios'
import type { DashboardResponseDto } from '../../types/inventario-dashboard'

// Cache ultra-optimizado para respuestas de API
const apiCache = new Map<string, { data: DashboardResponseDto; timestamp: number }>()
const API_CACHE_DURATION = 0 // 🔧 DESHABILITADO TEMPORALMENTE para forzar datos frescos

interface DashboardParams {
  sedeId: string
  consultorioId?: string
  from?: string
  to?: string
  organizationId?: string
}

export async function getDashboardMetrics(params: DashboardParams): Promise<DashboardResponseDto> {
  const startTime = performance.now()
  const { sedeId, consultorioId, from, to, organizationId } = params
  
  // Crear clave de caché optimizada
  const cacheKey = `dashboard:${sedeId}:${consultorioId || 'default'}:${organizationId || 'default'}:${from || 'all'}:${to || 'all'}`
  
  // Verificar caché primero
  const cached = apiCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < API_CACHE_DURATION) {
    console.log(`⚡ dashboard-service - Cache hit en ${(performance.now() - startTime).toFixed(2)}ms`)
    return cached.data
  }

  console.log('🌐 dashboard-service - Iniciando petición a API...')
  
  try {
    // SOLUCIÓN REAL: Usar el endpoint con autenticación
    const url = new URL('/api/inventory/dashboard/public', window.location.origin)
    url.searchParams.set('sedeId', sedeId)
    if (consultorioId) url.searchParams.set('consultorioId', consultorioId)
    if (organizationId) url.searchParams.set('organizationId', organizationId)
    if (from) url.searchParams.set('from', from)
    if (to) url.searchParams.set('to', to)
    
    // Log para diagnóstico (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 dashboard-service - URL llamada:', url.toString())
      console.log('🔍 dashboard-service - consultorioId enviado:', consultorioId)
    }

    const apiStartTime = performance.now()
    
    // Petición optimizada con timeout más generoso
    const response = await axios.get<DashboardResponseDto>(url.toString(), {
      timeout: 10000, // 10 segundos para dar más tiempo
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    const apiTime = performance.now() - apiStartTime
    console.log(`📡 dashboard-service - API respondió en ${apiTime.toFixed(2)}ms`)

    // Guardar en caché
    apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() })
    
    const totalTime = performance.now() - startTime
    console.log(`✅ dashboard-service - Datos obtenidos en ${totalTime.toFixed(2)}ms total`)
    
    return response.data
  } catch (error: any) {
    console.error('❌ dashboard-service - Error:', error)
    
    // Manejo más específico de errores
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: La petición tardó demasiado en responder')
    }
    
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('❌ dashboard-service - Response error:', error.response.data)
      throw new Error(error.response.data?.error || `Error del servidor: ${error.response.status}`)
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('❌ dashboard-service - Request error:', error.request)
      throw new Error('No se pudo conectar con el servidor')
    } else {
      // Error en la configuración de la petición
      console.error('❌ dashboard-service - Config error:', error.message)
      throw new Error(error.message || 'Error al obtener datos del dashboard')
    }
  }
}

export function clearDashboardCache(): void {
  apiCache.clear()
  console.log('🧹 dashboard-service - Caché limpiado')
} 