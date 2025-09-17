import { useState, useEffect, useCallback, useRef } from 'react'
import { getDashboardMetrics } from '../lib/api/dashboard-service'
import type { DashboardResponseDto } from '../types/inventario-dashboard'

// Cache global para los datos del dashboard
const dashboardCache = new Map<string, { data: DashboardResponseDto; timestamp: number }>()
const CACHE_DURATION = 0 // 🔧 DESHABILITADO TEMPORALMENTE para forzar datos frescos

export function useInventario(sedeId?: string, from?: string, to?: string, hasActiveFilter?: boolean, consultorioId?: string) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Obtener el organizationId del usuario autenticado
  const getOrganizationId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.organizacion_id
      }
      return null
    } catch (error) {
      console.error('Error obteniendo organizationId:', error)
      return null
    }
  }

  // Función optimizada para obtener datos
  const fetchData = useCallback(async (controller: AbortController) => {
    if (!sedeId) return

    const startTime = performance.now()
    const organizationId = getOrganizationId()

    // Crear clave de caché
    const cacheKey = `${sedeId}-${consultorioId || 'default'}-${organizationId || 'default'}-${from || 'default'}-${to || 'default'}-${hasActiveFilter || false}`
    const cached = dashboardCache.get(cacheKey)
    
    // Verificar si hay datos en caché válidos
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (!controller.signal.aborted) {
        setData(cached.data)
        setIsLoading(false)
      }
      return
    }

    try {
      const apiStartTime = performance.now()
      
      const response = await getDashboardMetrics({ 
        sedeId, 
        consultorioId,
        organizationId,
        from: hasActiveFilter ? from : undefined, 
        to: hasActiveFilter ? to : undefined 
      })
      
      if (!controller.signal.aborted) {
        setData(response)
        setError(null)
        
        // Guardar en caché
        dashboardCache.set(cacheKey, { data: response, timestamp: Date.now() })
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err?.message || 'Error al cargar inventario')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [sedeId, consultorioId, from, to, hasActiveFilter])

  // Cargar datos cuando cambien los parámetros
  useEffect(() => {
    if (!sedeId) return
    
    // Cancelar llamada anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Crear nuevo controller
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    setIsLoading(true)
    setError(null)
    
    // Cargar datos inmediatamente
    fetchData(controller)
    
    // Cleanup function
    return () => {
      controller.abort()
    }
  }, [sedeId, from, to, hasActiveFilter, fetchData])

  // Función para refrescar datos (ignorando caché)
  const refreshInventario = useCallback(async () => {
    if (!sedeId) return
    
    // Cancelar llamada anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    setIsLoading(true)
    setError(null)
    
    // Limpiar caché y hacer nueva petición
    dashboardCache.clear()
    
    try {
      const response = await getDashboardMetrics({ 
        sedeId, 
        from: hasActiveFilter ? from : undefined, 
        to: hasActiveFilter ? to : undefined 
      })
      
      if (!controller.signal.aborted) {
        setData(response)
        setError(null)
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError(err?.message || 'Error al refrescar inventario')
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [sedeId, from, to, hasActiveFilter])

  // Función para limpiar caché
  const clearCache = useCallback(() => {
    dashboardCache.clear()
  }, [])

  return { data, isLoading, error, refreshInventario, clearCache }
} 