'use client'

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InventoryUsageInput } from '@/schemas/inventory-usage'
import PacienteSearch from '@/components/PacienteSearch'
import { LastTreatmentBanner } from '@/components/inventario/inventory-exit-steps/LastTreatmentBanner'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface PatientStepProps {
  onNext: () => void;
}

export function PatientStep({ onNext }: PatientStepProps) {
  const {
    setValue,
    formState: { errors },
    watch,
  } = useFormContext<InventoryUsageInput>()
  const [pacientes, setPacientes] = useState<any[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastTreatment, setLastTreatment] = useState<any>(null)
  const [loadingLastTreatment, setLoadingLastTreatment] = useState(false)

  const pacienteId = watch('pacienteId')
  const nombrePaciente = watch('nombrePaciente')

  useEffect(() => {
    const loadPacientes = async () => {
      setLoading(true)
      try {
        const response = await axios.get('http://localhost:3002/api/pacientes')
        setPacientes(response.data)
      } catch (error) {
        console.error('Error cargando pacientes:', error)
        setPacientes([])
      } finally {
        setLoading(false)
      }
    }
    loadPacientes()
  }, [])

  // 🎯 FUNCIÓN PARA OBTENER EL ÚLTIMO TRATAMIENTO DEL PACIENTE
  const fetchLastTreatment = async (pacienteId: string) => {
    if (!pacienteId) {
      setLastTreatment(null)
      return
    }

    setLoadingLastTreatment(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/immunotherapy/last-treatment/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success && response.data.data) {
        console.log('✅ [PatientStep] Último tratamiento encontrado:', response.data.data)
        setLastTreatment(response.data.data)
      } else {
        console.log('ℹ️ [PatientStep] No se encontró tratamiento previo')
        setLastTreatment(null)
      }
    } catch (error) {
      console.error('❌ [PatientStep] Error obteniendo último tratamiento:', error)
      setLastTreatment(null)
    } finally {
      setLoadingLastTreatment(false)
    }
  }

  const handlePacienteSelect = (paciente: any) => {
    setSelectedPaciente(paciente)
    if (paciente) {
      setValue('nombrePaciente', `${paciente.nombre} ${paciente.apellido}`)
      setValue('pacienteId', paciente.id)
      // 🎯 BUSCAR ÚLTIMO TRATAMIENTO CUANDO SE SELECCIONA UN PACIENTE
      fetchLastTreatment(paciente.id)
    } else {
      setValue('nombrePaciente', '')
      setValue('pacienteId', '')
      setLastTreatment(null)
    }
  }

  // 🎯 FUNCIÓN PARA USAR EL ÚLTIMO TRATAMIENTO
  const handleUseLastTreatment = () => {
    if (lastTreatment) {
      console.log('🎯 [PatientStep] Usando último tratamiento:', lastTreatment)
      
      // Pre-rellenar el formulario con los datos del último tratamiento
      setValue('tipoTratamiento', 'INMUNOTERAPIA' as any)
      // @ts-ignore - Campo personalizado para pre-rellenado
      setValue('subtipo', lastTreatment.subtipo)
      
      // 🎯 AGREGAR DATOS DE PRE-RELLENADO A LA URL
      const searchParams = new URLSearchParams(window.location.search)
      searchParams.set('prefillData', JSON.stringify(lastTreatment))
      const newUrl = `${window.location.pathname}?${searchParams.toString()}`
      window.history.replaceState({}, '', newUrl)
      
      // Saltar al paso de detalles
      const event = new CustomEvent('jumpToStep', { detail: { step: 2, prefillData: lastTreatment } })
      window.dispatchEvent(event)
    }
  }

  // 🎯 FUNCIÓN PARA CONTINUAR NORMALMENTE
  const handleContinueNormal = () => {
    setLastTreatment(null)
    onNext()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Datos del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paciente" className="text-base text-[#1b2538]">Paciente *</Label>
            <PacienteSearch
              pacientes={pacientes}
              onPacienteSelect={handlePacienteSelect}
              placeholder="Buscar paciente por nombre..."
            />
            {errors.pacienteId && (
              <p className="text-red-500 text-sm mt-1">{errors.pacienteId.message as string}</p>
            )}
          </div>
          
          {/* 🎯 MOSTRAR LOADING DEL ÚLTIMO TRATAMIENTO */}
          {loadingLastTreatment && (
            <div className="text-center py-4">
              <p className="text-gray-600">Buscando último tratamiento...</p>
            </div>
          )}
          
          {/* 🎯 MOSTRAR BANNER DEL ÚLTIMO TRATAMIENTO */}
          {lastTreatment && !loadingLastTreatment && (
            <LastTreatmentBanner
              lastTreatment={lastTreatment}
              onUseLastTreatment={handleUseLastTreatment}
              onContinueNormal={handleContinueNormal}
            />
          )}
          
          {/* 🎯 BOTÓN SIGUIENTE (solo si no hay último tratamiento) */}
          {!lastTreatment && !loadingLastTreatment && (
            <Button onClick={onNext} className="w-full">
              Siguiente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 