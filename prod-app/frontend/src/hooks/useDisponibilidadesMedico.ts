import { useState, useCallback, useEffect } from 'react'
import {
  getDisponibilidades,
  crearDisponibilidad,
  actualizarDisponibilidad,
  eliminarDisponibilidad
} from '../services/disponibilidadService'

export interface DisponibilidadMedico {
  id: string
  usuario_id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export function useDisponibilidadesMedico(usuario_id?: string) {
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadMedico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const fetchDisponibilidades = useCallback(async () => {
    if (!usuario_id) return;
    
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching disponibilidades for usuario:', usuario_id)
      const data = await getDisponibilidades(usuario_id)
      setDisponibilidades(data)
      setLastUpdate(Date.now())
      console.log('✅ Disponibilidades actualizadas:', data.length, 'registros')
    } catch (err: any) {
      setError(err?.message || 'Error al cargar disponibilidades')
      console.error('❌ Error en fetchDisponibilidades:', err)
    } finally {
      setIsLoading(false)
    }
  }, [usuario_id])

  const create = useCallback(async (input: Omit<DisponibilidadMedico, 'id'>) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Creando disponibilidad:', input)
      await crearDisponibilidad(input)
      await fetchDisponibilidades()
      console.log('✅ Disponibilidad creada exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al crear disponibilidad')
      console.error('❌ Error al crear disponibilidad:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchDisponibilidades])

  const update = useCallback(async (id: string, input: { dia_semana: number; hora_inicio: string; hora_fin: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Actualizando disponibilidad:', id, input)
      await actualizarDisponibilidad(id, input)
      await fetchDisponibilidades()
      console.log('✅ Disponibilidad actualizada exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar disponibilidad')
      console.error('❌ Error al actualizar disponibilidad:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchDisponibilidades])

  const remove = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Eliminando disponibilidad:', id)
      await eliminarDisponibilidad(id)
      await fetchDisponibilidades()
      console.log('✅ Disponibilidad eliminada exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar disponibilidad')
      console.error('❌ Error al eliminar disponibilidad:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchDisponibilidades])

  // Cargar datos iniciales
  useEffect(() => {
    if (usuario_id) {
      console.log('🔄 Hook: Inicializando disponibilidades para usuario:', usuario_id)
      fetchDisponibilidades()
    }
  }, [usuario_id, fetchDisponibilidades])

  // Escuchar cambios en localStorage para sincronización entre páginas
  useEffect(() => {
    const handleStorageChange = () => {
      const disponibilidadesUpdated = localStorage.getItem('disponibilidades_updated')
      if (disponibilidadesUpdated && usuario_id) {
        const timestamp = parseInt(disponibilidadesUpdated)
        if (timestamp > lastUpdate) {
          console.log('🔄 Hook: Detectado cambio en localStorage, actualizando disponibilidades...')
          fetchDisponibilidades()
          localStorage.removeItem('disponibilidades_updated')
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
  }, [usuario_id, lastUpdate, fetchDisponibilidades])

  return {
    disponibilidades,
    isLoading,
    error,
    fetchDisponibilidades,
    create,
    update,
    remove,
    lastUpdate
  }
} 