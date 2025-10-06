import { useState, useCallback, useEffect } from 'react'
import { getAllServicios, createServicio, updateServicio, deleteServicio, Servicio } from '../services/conceptosService'
import { notifyChange, listenForChanges } from '../lib/sync-utils'

export function useConceptos() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const fetchServicios = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching servicios...')
      const data = await getAllServicios()
      setServicios(data)
      setLastUpdate(Date.now())
      console.log('✅ Servicios actualizados:', data.length, 'registros')
    } catch (err: any) {
      setError(err?.message || 'Error al cargar servicios')
      console.error('❌ Error en fetchServicios:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addServicio = useCallback(async (servicioData: Omit<Servicio, 'id'>) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Creando servicio:', servicioData)
      const result = await createServicio(servicioData)
      await fetchServicios()
      // Notificar a otros componentes sobre el cambio
      notifyChange('CONCEPTOS')
      console.log('✅ Servicio creado exitosamente')
      return result
    } catch (err: any) {
      setError(err?.message || 'Error al crear servicio')
      console.error('❌ Error al crear servicio:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchServicios])

  const editServicio = useCallback(async (id: string, servicioData: Omit<Servicio, 'id'>) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Actualizando servicio:', id, servicioData)
      await updateServicio(id, servicioData)
      await fetchServicios()
      // Notificar a otros componentes sobre el cambio
      notifyChange('CONCEPTOS')
      console.log('✅ Servicio actualizado exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar servicio')
      console.error('❌ Error al actualizar servicio:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchServicios])

  const removeServicio = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Eliminando servicio:', id)
      await deleteServicio(id)
      await fetchServicios()
      // Notificar a otros componentes sobre el cambio
      notifyChange('CONCEPTOS')
      console.log('✅ Servicio eliminado exitosamente')
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar servicio')
      console.error('❌ Error al eliminar servicio:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fetchServicios])

  // Cargar datos iniciales
  useEffect(() => {
    console.log('🔄 Hook: Inicializando servicios...')
    fetchServicios()
  }, [fetchServicios])

  // Escuchar cambios para sincronización automática
  useEffect(() => {
    return listenForChanges('CONCEPTOS', fetchServicios)
  }, [fetchServicios])

  return {
    servicios,
    isLoading,
    error,
    fetchServicios,
    addServicio,
    editServicio,
    removeServicio,
    lastUpdate
  }
} 