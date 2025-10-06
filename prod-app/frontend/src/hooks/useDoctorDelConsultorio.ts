import { useState, useCallback, useEffect } from 'react'
import { getDoctorDelConsultorio } from '../services/disponibilidadService'

export interface DoctorDelConsultorio {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: string
  consultorio_id: string
}

export function useDoctorDelConsultorio(consultorioId?: string) {
  const [doctor, setDoctor] = useState<DoctorDelConsultorio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDoctor = useCallback(async () => {
    if (!consultorioId) return;
    
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Obteniendo doctor del consultorio:', consultorioId)
      const data = await getDoctorDelConsultorio(consultorioId)
      setDoctor(data)
      console.log('✅ Doctor obtenido:', data)
    } catch (err: any) {
      setError(err?.message || 'Error al obtener doctor del consultorio')
      console.error('❌ Error obteniendo doctor del consultorio:', err)
      setDoctor(null)
    } finally {
      setIsLoading(false)
    }
  }, [consultorioId])

  useEffect(() => {
    fetchDoctor()
  }, [fetchDoctor])

  return {
    doctor,
    isLoading,
    error,
    refetch: fetchDoctor
  }
}

