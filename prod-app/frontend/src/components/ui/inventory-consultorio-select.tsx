'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Consultorio {
  id: string
  nombre: string
  direccion: string
}

interface ConsultorioInfo {
  consultorios: Consultorio[]
  userRole: string
  currentConsultorio: Consultorio | null
  canSelectMultiple: boolean
}

interface InventoryConsultorioSelectProps {
  value: string
  onChange: (value: string) => void
  onConsultorioInfoChange?: (info: ConsultorioInfo | null) => void
  placeholder?: string
  showUserInfo?: boolean
  disabled?: boolean
}

export function InventoryConsultorioSelect({
  value,
  onChange,
  onConsultorioInfoChange,
  placeholder = "Seleccionar consultorio",
  showUserInfo = false,
  disabled = false
}: InventoryConsultorioSelectProps) {
  const [consultorioInfo, setConsultorioInfo] = useState<ConsultorioInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConsultorios()
  }, [])

  async function fetchConsultorios() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/consultorios/usuario', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar consultorios')
      }
      
      const data = await response.json()
      setConsultorioInfo(data)
      
      if (onConsultorioInfoChange) {
        onConsultorioInfoChange(data)
      }
      
      // Si el usuario no puede seleccionar múltiples, preseleccionar su consultorio
      if (!data.canSelectMultiple && data.currentConsultorio) {
        onChange(data.currentConsultorio.id)
      }
      
    } catch (err) {
      console.error('Error fetching consultorios:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
        {showUserInfo && (
          <div className="text-sm text-gray-500">
            Cargando información del usuario...
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-red-50 border border-red-200 rounded-md flex items-center px-3">
          <span className="text-red-600 text-sm">Error: {error}</span>
        </div>
      </div>
    )
  }

  if (!consultorioInfo) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-50 border border-gray-200 rounded-md flex items-center px-3">
          <span className="text-gray-500 text-sm">No se pudo cargar la información</span>
        </div>
      </div>
    )
  }

  // Si el usuario no puede seleccionar múltiples, mostrar solo su consultorio
  if (!consultorioInfo.canSelectMultiple) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-50 border border-gray-200 rounded-md flex items-center px-3">
          <span className="text-gray-700 font-medium">
            {consultorioInfo.currentConsultorio?.nombre || 'Consultorio no asignado'}
          </span>
        </div>
        {showUserInfo && (
          <div className="text-sm text-gray-500">
            <div>Rol: {consultorioInfo.userRole}</div>
            <div>Consultorio: {consultorioInfo.currentConsultorio?.nombre}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {consultorioInfo.consultorios.map((consultorio) => (
            <SelectItem key={consultorio.id} value={consultorio.id}>
              <div className="flex flex-col">
                <span className="font-medium">{consultorio.nombre}</span>
                <span className="text-xs text-gray-500">{consultorio.direccion}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showUserInfo && (
        <div className="text-sm text-gray-500">
          <div>Rol: {consultorioInfo.userRole}</div>
          <div>Puede seleccionar múltiples consultorios</div>
        </div>
      )}
    </div>
  )
}


























