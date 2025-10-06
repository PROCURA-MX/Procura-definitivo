'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm, FormProvider, useFormContext, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { inventoryUsageSchema, InventoryUsageInput, InventoryUsageDetailInput } from '@/schemas/inventory-usage'
import { notifyChange } from '@/lib/sync-utils'
import { useConsultorioContext } from '@/contexts/ConsultorioContext'
import { useConsultorioSedeMapping } from '@/hooks/useConsultorioSedeMapping'
import { PatientStep } from '@/components/inventario/inventory-exit-steps/PatientStep'
import { TreatmentTypeStep } from '@/components/inventario/inventory-exit-steps/TreatmentTypeStep'
import { DetailsStep } from '@/components/inventario/inventory-exit-steps/DetailsStep'
import { Button } from '@/components/inventario/ui/button'
import { Label } from '@/components/inventario/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/inventario/ui/radio-group'
import { Textarea } from '@/components/inventario/ui/textarea'
import { InventoryConsultorioSelect } from '@/components/ui/inventory-consultorio-select'
import api from '@/services/api'

// Define los pasos del formulario
const steps = ['PATIENT_NAME', 'TREATMENT_TYPE', 'DETAILS', 'SUMMARY']

function ReactionForm() {
    const { register, control } = useFormContext<InventoryUsageInput>()
    const tuvoReaccion = useWatch({
        control,
        name: 'tuvoReaccion'
    })

    return (
        <div className="space-y-4">
             <div className="space-y-2">
                <Label className="text-gray-900 font-medium">Observaciones Adicionales</Label>
                <Textarea {...register('observaciones')} placeholder="Anotaciones sobre el tratamiento o el paciente..." className="text-gray-900" />
            </div>
            <div className="space-y-2">
                <Label className="text-gray-900 font-medium">¿El paciente tuvo alguna reacción?</Label>
                 <Controller
                    name="tuvoReaccion"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup
                            onValueChange={(value: string) => field.onChange(value === 'true')}
                            value={String(field.value)}
                            className="flex items-center space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="reaccion-si" className="border-gray-400" />
                                <Label htmlFor="reaccion-si" className="text-gray-900">Sí</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="reaccion-no" className="border-gray-400" />
                                <Label htmlFor="reaccion-no" className="text-gray-900">No</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </div>
            {tuvoReaccion === true && (
                 <div className="space-y-2">
                    <Label className="text-gray-900 font-medium">Descripción de la Reacción</Label>
                    <Textarea {...register('descripcionReaccion')} placeholder="Detalle la reacción observada..." className="text-gray-900" />
                </div>
            )}
        </div>
    )
}

function SummaryStep({ 
    onBack, 
    isPending,
    selectedConsultorioId,
    setSelectedConsultorioId,
    setConsultorioInfo,
    contextConsultorioId
}: { 
    onBack: () => void, 
    isPending: boolean,
    selectedConsultorioId: string,
    setSelectedConsultorioId: (value: string) => void,
    setConsultorioInfo: (info: any) => void,
    contextConsultorioId: string | null
}) {
    const { consultorios } = useConsultorioContext()
    const { control } = useFormContext<InventoryUsageInput>()
    const [nombrePaciente, items] = useWatch({
        control,
        name: ['nombrePaciente', 'items']
    })

    // Verificar si el usuario puede cambiar consultorio
    const canChangeConsultorio = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const userRole = user.rol || 'USER'
            const userConsultorioId = user.consultorio_id
            
            // Solo doctores pueden cambiar consultorio
            if (userRole !== 'DOCTOR') return false
            
            // Si está en "todos los consultorios", puede seleccionar consultorio específico
            if (contextConsultorioId === 'todos') return true
            
            // Si el usuario tiene un consultorio asignado y NO está en "todos", no puede cambiar
            if (userConsultorioId && contextConsultorioId && contextConsultorioId !== 'todos') return false
            
            // Si hay múltiples consultorios disponibles, puede cambiar
            return true
        } catch (error) {
            return false
        }
    }

    // Obtener información del usuario para mostrar el rol
    const getUserInfo = () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            return {
                role: user.rol || 'USER',
                consultorioId: user.consultorio_id
            }
        } catch (error) {
            return { role: 'USER', consultorioId: null }
        }
    }

    const userInfo = getUserInfo()
    const canChange = canChangeConsultorio()

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen y Reacciones</h3>
            <div className="p-4 my-4 border rounded-md bg-muted/50 text-gray-900">
                <p><strong>Paciente:</strong> {nombrePaciente}</p>
                <div className="mt-2">
                    <p><strong>Consultorio:</strong></p>
                    {canChange ? (
                        <div className="space-y-2">
                            <InventoryConsultorioSelect
                                value={selectedConsultorioId}
                                onChange={setSelectedConsultorioId}
                                onConsultorioInfoChange={setConsultorioInfo}
                                placeholder="Elija el consultorio donde se aplicó el tratamiento"
                                showUserInfo={false}
                            />
                            {!selectedConsultorioId && (
                                <p className="text-xs text-red-600">
                                    ⚠️ <strong>Campo obligatorio:</strong> Debes seleccionar un consultorio
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="p-2 bg-gray-100 rounded border text-gray-700">
                                {selectedConsultorioId ? 
                                    `📍 ${consultorios.find(c => c.id === selectedConsultorioId)?.nombre || selectedConsultorioId}` : 
                                    'Consultorio no seleccionado'
                                }
                            </div>
                            <p className="text-xs text-gray-600">
                                {userInfo.role === 'DOCTOR' ? 
                                    '👨‍⚕️ Doctor: Consultorio fijo asignado' : 
                                    '👩‍⚕️ Personal: Consultorio automático según tu asignación'
                                }
                            </p>
                        </div>
                    )}
                </div>
                <p className="mt-2"><strong>Items aplicados:</strong></p>
                <ul className="pl-5 list-disc">
                    {(items || []).map((d: InventoryUsageDetailInput, i: number) => <li key={i}>Producto ID: {d.productId} - Cantidad: {d.cantidad}</li>)}
                </ul>
            </div>

            <ReactionForm />

            <div className="flex justify-between mt-8">
                <Button onClick={onBack} variant="outline" type="button" disabled={isPending} className="text-white border-white hover:bg-white hover:text-gray-800">Atrás</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Registrando...' : 'Registrar Salida'}
                </Button>
            </div>
        </div>
    )
}

export default function InventoryExitForm() {
  // Obtener el consultorio seleccionado del contexto
  const { selectedConsultorioId: contextConsultorioId, consultorios } = useConsultorioContext()
  
  // Obtener el mapeo dinámico de consultorios a sedes
  const { getSedeIdForInventory } = useConsultorioSedeMapping()
  
  // Verificar si el usuario puede cambiar consultorio
  const canChangeConsultorio = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const userRole = user.rol || 'USER'
      const userConsultorioId = user.consultorio_id
      
      // Solo doctores pueden cambiar consultorio
      if (userRole !== 'DOCTOR') return false
      
      // Si el usuario tiene un consultorio asignado, no puede cambiar
      if (userConsultorioId) return false
      
      // Si está en "todos los consultorios", puede seleccionar
      if (contextConsultorioId === 'todos') return true
      
      // Si hay múltiples consultorios disponibles, puede cambiar
      return true
    } catch (error) {
      return false
    }
  }

  // Función para obtener el consultorio inicial automáticamente
  const getInitialConsultorioId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const userRole = user.rol || 'USER'
      const userConsultorioId = user.consultorio_id
      
      // 🎯 VERIFICAR SI VIENE DESDE EXPEDIENTE (PRE-RELLENADO)
      const searchParams = new URLSearchParams(window.location.search)
      const urlPrefillData = searchParams.get('prefillData')
      
      if (urlPrefillData) {
        console.log('🔍 [InventoryExitForm] Detectado pre-rellenado desde expediente')
        
        // 🎯 LÓGICA ESPECIAL PARA PRE-RELLENADO DESDE EXPEDIENTE
        if (userRole !== 'DOCTOR' && userConsultorioId) {
          // Enfermeras: Auto-seleccionar su consultorio asignado
          console.log('✅ [InventoryExitForm] Enfermera - Auto-seleccionando consultorio asignado:', userConsultorioId)
          return userConsultorioId
        } else if (userRole === 'DOCTOR') {
          // Doctores: Pueden elegir consultorio (no auto-seleccionar)
          console.log('ℹ️ [InventoryExitForm] Doctor - Consultorio editable para selección')
          return '' // Dejar vacío para que seleccione
        }
      }
      
      // 🎯 LÓGICA NORMAL (SIN PRE-RELLENADO)
      // Si es secretaria/nurse con consultorio asignado, usar ese
      if (userRole !== 'DOCTOR' && userConsultorioId) {
        return userConsultorioId
      }
      
      // Si es doctor con consultorio asignado y NO está en "todos", usar ese
      if (userRole === 'DOCTOR' && userConsultorioId && contextConsultorioId !== 'todos') {
        return userConsultorioId
      }
      
      // Si es doctor en "todos los consultorios", auto-seleccionar SOLO si hay 1 consultorio
      if (userRole === 'DOCTOR' && contextConsultorioId === 'todos') {
        if (consultorios.length === 1) {
          // ✅ ARREGLADO: Solo auto-seleccionar si hay exactamente 1 consultorio
          console.log('🔧 [InventoryExitForm] AUTO-SELECCIONANDO consultorio (1 solo disponible):', consultorios[0].nombre)
          return consultorios[0].id
        } else {
          // ✅ ARREGLADO: Si hay múltiples consultorios, NO auto-seleccionar
          console.log('🔧 [InventoryExitForm] MÚLTIPLES CONSULTORIOS - Forzando selección manual del usuario')
          return '' // Dejar vacío para forzar selección
        }
      }
      
      // Si es doctor sin consultorio asignado y está en un consultorio específico
      if (userRole === 'DOCTOR' && !userConsultorioId && contextConsultorioId && contextConsultorioId !== 'todos') {
        return contextConsultorioId || (consultorios.length > 0 ? consultorios[0].id : '')
      }
      
      // Fallback al contexto
      return contextConsultorioId || ''
    } catch (error) {
      return contextConsultorioId || ''
    }
  }
  
  // 🎯 DETECTAR SI VIENE DESDE EXPEDIENTE PARA SALTAR AUTOMÁTICAMENTE
  const [currentStep, setCurrentStep] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlPrefillData = searchParams.get('prefillData')
    
    if (urlPrefillData) {
      console.log('🚀 [InventoryExitForm] Detectado pre-rellenado desde expediente - iniciando en paso 2 (DETAILS)')
      return 2 // Saltar directamente al paso de detalles
    }
    
    return 0 // Flujo normal
  })

  const errorRef = useRef<HTMLParagraphElement>(null)
  const [unexpectedError, setUnexpectedError] = useState<string | null>(null)

  // 🎯 ESCUCHAR EVENTO PARA SALTAR DIRECTAMENTE AL PASO 3 (DETAILS)
  useEffect(() => {
    const handleJumpToStep = (event: CustomEvent) => {
      const { step } = event.detail
      console.log('🚀 [InventoryExitForm] Saltando al paso:', step)
      setCurrentStep(step)
    }

    window.addEventListener('jumpToStep', handleJumpToStep as EventListener)
    
    return () => {
      window.removeEventListener('jumpToStep', handleJumpToStep as EventListener)
    }
  }, [])
  const [isPending, setIsPending] = useState(false)
  const [lastResult, setLastResult] = useState<any | null>(null)
  const [selectedConsultorioId, setSelectedConsultorioId] = useState<string>(getInitialConsultorioId())
  
  // Logging para debug
  console.log('🔍 InventoryExitForm - contextConsultorioId:', contextConsultorioId)
  console.log('🔍 InventoryExitForm - selectedConsultorioId:', selectedConsultorioId)
  console.log('🔍 InventoryExitForm - consultorios disponibles:', consultorios.map(c => ({ id: c.id, nombre: c.nombre })))
  const [consultorioInfo, setConsultorioInfo] = useState<any>(null)
  
  // Sincronizar el consultorio seleccionado cuando cambie el contexto
  useEffect(() => {
    const initialConsultorioId = getInitialConsultorioId()
    console.log('🔄 useEffect - contextConsultorioId cambió a:', contextConsultorioId)
    console.log('🔄 useEffect - initialConsultorioId calculado:', initialConsultorioId)
    console.log('🔄 useEffect - selectedConsultorioId actual:', selectedConsultorioId)
    
    // Solo sincronizar si NO estamos en "todos los consultorios" para doctores
    if (contextConsultorioId && contextConsultorioId !== 'todos') {
      console.log('🔄 Sincronizando con consultorio del dashboard:', contextConsultorioId)
      setSelectedConsultorioId(contextConsultorioId)
    } else if (contextConsultorioId === 'todos') {
      // Si estamos en "todos los consultorios", verificar si es doctor sin consultorio asignado
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const userRole = user.rol || 'USER'
        const userConsultorioId = user.consultorio_id
        
        // Si es doctor sin consultorio asignado en "todos", NO auto-seleccionar
        if (userRole === 'DOCTOR' && !userConsultorioId) {
          console.log('🔄 Doctor en "todos los consultorios" - forzando selección de consultorio')
          setSelectedConsultorioId('') // Dejar vacío para que seleccione
        } else if (initialConsultorioId && initialConsultorioId !== selectedConsultorioId) {
          console.log('🔄 Sincronizando consultorio seleccionado:', initialConsultorioId)
          setSelectedConsultorioId(initialConsultorioId)
        }
      } catch (error) {
        console.error('Error verificando usuario:', error)
      }
    } else if (initialConsultorioId && initialConsultorioId !== selectedConsultorioId) {
      console.log('🔄 Sincronizando consultorio seleccionado:', initialConsultorioId)
      setSelectedConsultorioId(initialConsultorioId)
    }
  }, [contextConsultorioId, consultorios, selectedConsultorioId])
  
  const methods = useForm<InventoryUsageInput>({
    resolver: zodResolver(inventoryUsageSchema),
    mode: 'onSubmit',
    defaultValues: { 
      items: [],
      tuvoReaccion: false,
      consultorioId: '',
     },
  })

  const { setValue } = methods

  // 🎯 ESTABLECER DATOS DEL PACIENTE Y TIPO DE TRATAMIENTO CUANDO VIENE DESDE EXPEDIENTE
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlPacienteId = searchParams.get('pacienteId')
    const urlPrefillData = searchParams.get('prefillData')
    
    if (urlPacienteId && urlPrefillData && currentStep === 2) {
      try {
        const prefillDataParsed = JSON.parse(urlPrefillData)
        console.log('🔧 [InventoryExitForm] Estableciendo datos del paciente y tratamiento desde expediente:', {
          pacienteId: urlPacienteId,
          subtipo: prefillDataParsed.subtipo
        })
        
        // Establecer datos del paciente
        setValue('pacienteId', urlPacienteId)
        setValue('nombrePaciente', prefillDataParsed.nombrePaciente || 'Paciente')
        
        // Establecer el tipo de tratamiento en el formulario
        setValue('tipoTratamiento', 'INMUNOTERAPIA' as any)
        // @ts-ignore - Campo personalizado para pre-rellenado
        setValue('subtipo', prefillDataParsed.subtipo)
        
        console.log('✅ [InventoryExitForm] Datos del paciente y tipo de tratamiento establecidos correctamente')
      } catch (error) {
        console.error('❌ [InventoryExitForm] Error estableciendo datos desde expediente:', error)
      }
    }
  }, [currentStep, setValue])

  const handleNext = async () => {
    let fieldsToValidate: (keyof InventoryUsageInput)[] = []
    if (steps[currentStep] === 'PATIENT_NAME') fieldsToValidate.push('nombrePaciente')
    if (steps[currentStep] === 'TREATMENT_TYPE') fieldsToValidate.push('tipoTratamiento')
    if (steps[currentStep] === 'DETAILS') fieldsToValidate.push('items')
    
    // 🎯 LOG DE DIAGNÓSTICO PARA ITEMS
    if (steps[currentStep] === 'DETAILS') {
      console.log('🔍 [InventoryExitForm] Validando paso DETAILS')
      console.log('🔍 [InventoryExitForm] Items actuales:', methods.getValues('items'))
      console.log('🔍 [InventoryExitForm] Estado del formulario:', methods.formState)
    }
    
    const isValid = await methods.trigger(fieldsToValidate)
    if (!isValid) {
      console.warn('❌ [InventoryExitForm] Errores de validación:', methods.formState.errors)
    } else {
      console.log('✅ [InventoryExitForm] Validación exitosa para:', fieldsToValidate)
    }
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => setCurrentStep((prev) => prev - 1)

  const onSubmit = async (data: InventoryUsageInput) => {
    // 🎯 LOG CRÍTICO - VER QUÉ DATOS LLEGAN AL SUBMIT
    console.log('🎯 [InventoryExitForm] onSubmit llamado con datos:', data)
    console.log('🎯 [InventoryExitForm] Items en onSubmit:', data.items)
    console.log('🎯 [InventoryExitForm] Longitud de items:', data.items?.length)
    console.log('🎯 [InventoryExitForm] Estado completo del formulario:', methods.getValues())
    
    // 🎯 SOLUCIÓN: USAR ITEMS LOCALES SI EL FORMULARIO PRINCIPAL ESTÁ VACÍO
    let finalData = { ...data }
    
    // @ts-ignore - Acceder a items locales desde referencia global
    if (window.localItemsRef && (!data.items || data.items.length === 0 || (data.items.length === 1 && Object.keys(data.items[0]).length === 0))) {
      // @ts-ignore
      const localItems = window.localItemsRef
      if (localItems && localItems.length > 0) {
        console.log('🎯 [InventoryExitForm] Usando items locales como backup:', localItems)
        finalData.items = localItems
      }
    }
    
    console.log('🎯 [InventoryExitForm] Datos finales a enviar:', finalData)
    
    // Verificar autenticación antes de proceder
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      toast.error('Debes iniciar sesión para registrar una salida de inventario.')
      setUnexpectedError('Debes iniciar sesión para registrar una salida de inventario.')
      return;
    }
    
    if (!data.tipoTratamiento) {
      toast.error('Debes seleccionar un tipo de tratamiento antes de registrar la salida.')
      if (errorRef.current) errorRef.current.focus()
      setUnexpectedError('Debes seleccionar un tipo de tratamiento antes de registrar la salida.')
      return
    }
    
    // Verificar que se haya seleccionado un consultorio cuando el doctor está en "todos los consultorios"
    if (contextConsultorioId === 'todos') {
      try {
        const userData = JSON.parse(user)
        const userRole = userData.rol || 'USER'
        
        // Si es doctor en "todos los consultorios", debe seleccionar un consultorio obligatoriamente
        if (userRole === 'DOCTOR' && !selectedConsultorioId) {
          toast.error('Debes seleccionar un consultorio específico para registrar la salida.')
          setUnexpectedError('Debes seleccionar un consultorio específico para registrar la salida.')
          return
        }
      } catch (error) {
        console.error('Error verificando usuario:', error)
      }
    }
    
    // Obtener el sedeId específico para operaciones de inventario
    const sedeId = getSedeIdForInventory(selectedConsultorioId || contextConsultorioId || 'todos')
    
    // Agregar el sedeId y consultorioId a los datos
    const dataWithSedeId = {
      ...data,
      sedeId: sedeId,
      consultorioId: selectedConsultorioId
    }
    
    console.log('🔍 Verificando autenticación...')
    console.log('🔑 Token presente:', !!token)
    console.log('👤 Usuario presente:', !!user)
    console.log('🔍 Enviando datos con sedeId:', sedeId)
    console.log('🔍 Consultorio seleccionado:', selectedConsultorioId)
    console.log('🔍 Datos completos:', dataWithSedeId)
    
    setUnexpectedError(null)
    setIsPending(true)
    try {
      const res = await api.post('/inventory/use', dataWithSedeId)
      const result = res.data
      if (result.success) {
        toast.success('Salida registrada')
        setLastResult(result.data)
        methods.reset()
        setCurrentStep(0)
        setUnexpectedError(null)
        // Notificar a otros componentes sobre el cambio
        notifyChange('INVENTARIO')
      } else {
        toast.error(result.error || 'Error al registrar')
        setUnexpectedError(result.error)
      }
    } catch (err) {
      console.error('❌ Error en onSubmit:', err)
      toast.error('Ocurrió un error inesperado.')
      setUnexpectedError('Ocurrió un error inesperado. Intenta de nuevo o contacta soporte.')
    } finally {
      setIsPending(false)
    }
  }

  if (lastResult) {
    // Mostrar resumen de la salida registrada
    return (
      <div className="space-y-8 p-6 border rounded bg-green-50">
        <h2 className="text-xl font-bold text-green-800">¡Salida registrada exitosamente!</h2>
        <div className="text-gray-900">
          <p><strong>Paciente:</strong> {lastResult.nombrePaciente}</p>
          <p><strong>Tratamiento:</strong> {lastResult.tipoTratamiento}</p>
          <p><strong>Fecha:</strong> {new Date(lastResult.updatedAt || lastResult.createdAt || Date.now()).toLocaleString()}</p>
        </div>
        <div className="text-gray-900">
          <strong>Productos/Alérgenos utilizados:</strong>
          <ul className="list-disc pl-6">
            {(lastResult.details || []).map((d: any, i: number) => (
              <li key={i}>{d.productId} - Cantidad: {d.quantity}</li>
            ))}
          </ul>
        </div>
        <Button onClick={() => setLastResult(null)} type="button">Nueva salida</Button>
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        {unexpectedError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
            {unexpectedError}
          </div>
        )}
        {Object.values(methods.formState.errors).length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 text-sm">
            {Object.values(methods.formState.errors).map((err: any, i) => err?.message && <div key={i}>{err.message}</div>)}
          </div>
        )}
        {steps[currentStep] === 'PATIENT_NAME' && <PatientStep onNext={handleNext} />}
        {steps[currentStep] === 'TREATMENT_TYPE' && <TreatmentTypeStep onNext={handleNext} onBack={handleBack} />}
        {steps[currentStep] === 'DETAILS' && (
          <div>
            <DetailsStep />
            {methods.formState.errors.items && (
              <div className="text-red-600 text-xs mt-2">{methods.formState.errors.items.message}</div>
            )}
            <div className="flex justify-between mt-4">
                <Button onClick={handleBack} variant="outline" type="button" className="text-white border-white hover:bg-white hover:text-gray-800">Atrás</Button>
                <Button onClick={handleNext} type="button">Siguiente</Button>
            </div>
          </div>
        )}
        {steps[currentStep] === 'SUMMARY' && (
          <SummaryStep 
            onBack={handleBack} 
            isPending={isPending}
            selectedConsultorioId={selectedConsultorioId}
            setSelectedConsultorioId={setSelectedConsultorioId}
            setConsultorioInfo={setConsultorioInfo}
            contextConsultorioId={contextConsultorioId}
          />
        )}
        <p ref={errorRef} tabIndex={-1} className="sr-only text-red-600">Debes seleccionar un tipo de tratamiento antes de registrar la salida.</p>
      </form>
    </FormProvider>
  )
}