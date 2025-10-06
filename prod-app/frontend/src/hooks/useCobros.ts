import { useState, useCallback, useEffect } from 'react'
import { getCobros, crearCobro, editarCobro, eliminarCobro } from '../services/cobrosService'
import { notifyChange, listenForChanges } from '../lib/sync-utils'

export interface Cobro {
  id: string
  paciente_id: string
  fecha_cobro: string
  total: number
  estado: string
  created_at: string
  updated_at: string
  paciente_nombre?: string
  paciente_apellido?: string
  usuario_nombre?: string
  usuario_apellido?: string
  consultorio_nombre?: string
}

export function useCobros(consultorioId?: string | null) {
  const [cobros, setCobros] = useState<Cobro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const fetchCobros = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCobros(consultorioId)
      setCobros(data)
      setLastUpdate(Date.now())
    } catch (err: any) {
      setError(err?.message || 'Error al cargar cobros')
    } finally {
      setIsLoading(false)
    }
  }, [consultorioId])

  const create = useCallback(async (cobroData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await crearCobro(cobroData)
      await fetchCobros()
      // Notificar a otros componentes sobre el cambio
      notifyChange('COBROS')
      return result
    } catch (err: any) {
      setError(err?.message || 'Error al crear cobro')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchCobros])

  const update = useCallback(async (id: string, cobroData: any) => {
    setIsLoading(true)
    setError(null)
    try {
      await editarCobro(id, cobroData)
      await fetchCobros()
      // Notificar a otros componentes sobre el cambio
      notifyChange('COBROS')
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar cobro')
    } finally {
      setIsLoading(false)
    }
  }, [fetchCobros])

  const remove = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await eliminarCobro(id)
      await fetchCobros()
      // Notificar a otros componentes sobre el cambio
      notifyChange('COBROS')
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar cobro')
    } finally {
      setIsLoading(false)
    }
  }, [fetchCobros])

  // Cargar datos iniciales y cuando cambie el consultorio
  useEffect(() => {
    fetchCobros()
  }, [fetchCobros])

  // Escuchar cambios para sincronización automática
  useEffect(() => {
    return listenForChanges('COBROS', fetchCobros)
  }, [fetchCobros])



  return {
    cobros,
    isLoading,
    error,
    fetchCobros,
    create,
    update,
    remove,
    lastUpdate
  }
} 