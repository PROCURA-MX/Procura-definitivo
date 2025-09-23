import { useState, useCallback, useEffect } from 'react'
import {
  getBloqueos,
  crearBloqueo,
  actualizarBloqueo,
  eliminarBloqueo
} from '../services/bloqueoService'

export interface BloqueoMedico {
  id: string
  usuario_id: string
  fecha_inicio: string
  fecha_fin: string
  motivo: string
}

export function useBloqueosMedico(usuario_id?: string) {
  const [bloqueos, setBloqueos] = useState<BloqueoMedico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const fetchBloqueos = useCallback(async () => {
    if (!usuario_id) return;
    
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching bloqueos for usuario:', usuario_id)
      const data = await getBloqueos(usuario_id)
      setBloqueos(data)
      setLastUpdate(Date.now())
      console.log('✅ Bloqueos actualizados:', data.length, 'registros')
    } catch (err: any) {
      setError(err?.message || 'Error al cargar bloqueos')
      console.error('❌ Error en fetchBloqueos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [usuario_id])

  const create = useCallback(async (input: Omit<BloqueoMedico, 'id'>) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Creando bloqueo:', input)
      await crearBloqueo(input)
      await fetchBloqueos()
      console.log('✅ Bloqueo creado exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al crear bloqueo')
      console.error('❌ Error al crear bloqueo:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBloqueos])

  const update = useCallback(async (id: string, input: { fecha_inicio: string; fecha_fin: string; motivo: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Actualizando bloqueo:', id, input)
      await actualizarBloqueo(id, input)
      await fetchBloqueos()
      console.log('✅ Bloqueo actualizado exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar bloqueo')
      console.error('❌ Error al actualizar bloqueo:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBloqueos])

  const remove = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Eliminando bloqueo:', id)
      await eliminarBloqueo(id)
      await fetchBloqueos()
      console.log('✅ Bloqueo eliminado exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar bloqueo')
      console.error('❌ Error al eliminar bloqueo:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBloqueos])

  // Cargar datos iniciales
  useEffect(() => {
    if (usuario_id) {
      console.log('🔄 Hook: Inicializando bloqueos para usuario:', usuario_id)
      fetchBloqueos()
    }
  }, [usuario_id, fetchBloqueos])

  // Escuchar cambios en localStorage para sincronización entre páginas
  useEffect(() => {
    const handleStorageChange = () => {
      const disponibilidadesUpdated = localStorage.getItem('disponibilidades_updated')
      if (disponibilidadesUpdated && usuario_id) {
        const timestamp = parseInt(disponibilidadesUpdated)
        if (timestamp > lastUpdate) {
          console.log('🔄 Hook: Detectado cambio en localStorage, actualizando bloqueos...')
          fetchBloqueos()
        }
      }
    }

    // Verificar inmediatamente
    handleStorageChange()
    
    // Escuchar cambios
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [usuario_id, lastUpdate, fetchBloqueos])

  return {
    bloqueos,
    isLoading,
    error,
    fetchBloqueos,
    create,
    update,
    remove,
    lastUpdate
  }
} 