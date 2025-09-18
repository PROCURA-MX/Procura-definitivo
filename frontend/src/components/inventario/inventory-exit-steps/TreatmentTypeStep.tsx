'use client'

import { useFormContext, useWatch, useFieldArray } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { InventoryUsageInput } from '@/schemas/inventory-usage'
import { TipoTratamiento } from '@/types/inventory'
import { ProductAutocomplete } from '../ProductAutocomplete'
import { Stethoscope, Syringe, TestTube, Baby, Pill, UserCheck, Search } from 'lucide-react'
import React, { useEffect } from 'react'

interface TreatmentTypeStepProps {
  onNext: () => void
  onBack: () => void
}

const treatmentLabels: Record<TipoTratamiento, string> = {
  [TipoTratamiento.INMUNOTERAPIA]: 'Inmunoterapia',
  [TipoTratamiento.PRUEBAS]: 'Pruebas',
  [TipoTratamiento.GAMMAGLOBULINA]: 'Gammaglobulina',
  [TipoTratamiento.VACUNAS_PEDIATRICAS]: 'Vacunas Pediátricas',
  [TipoTratamiento.MEDICAMENTOS_EXTRAS]: 'Medicamentos Extras',
  [TipoTratamiento.CONSULTA]: 'Consulta',
}

const treatmentIcons: Record<TipoTratamiento, React.ReactNode> = {
  [TipoTratamiento.INMUNOTERAPIA]: <Syringe className="w-8 h-8" />,
  [TipoTratamiento.PRUEBAS]: <TestTube className="w-8 h-8" />,
  [TipoTratamiento.GAMMAGLOBULINA]: <Pill className="w-8 h-8" />,
  [TipoTratamiento.VACUNAS_PEDIATRICAS]: <Baby className="w-8 h-8" />,
  [TipoTratamiento.MEDICAMENTOS_EXTRAS]: <Pill className="w-8 h-8" />,
  [TipoTratamiento.CONSULTA]: <Stethoscope className="w-8 h-8" />,
}

export function TreatmentTypeStep({ onNext, onBack }: TreatmentTypeStepProps) {
  const { setValue, formState: { errors }, trigger } = useFormContext<InventoryUsageInput>()
  const tipoTratamiento = useWatch({ name: 'tipoTratamiento' })
  const { fields, append, remove } = useFieldArray({ name: 'items' })

  const handleSelect = async (value: TipoTratamiento) => {
    setValue('tipoTratamiento', value, { shouldValidate: true })
    const valid = await trigger('tipoTratamiento')
    if (valid) onNext()
  }

  // Función para detectar el tipo de tratamiento basado en el producto
  const detectTreatmentType = (productName: string, productCategory: string): TipoTratamiento | null => {
    const name = productName.toLowerCase().trim()
    const category = productCategory.toLowerCase().trim()

    console.log('🔍 Detectando tipo para:', { name, category })

    // PRIMERO: Detectar por categoría (más confiable)
    if (category.includes('alérgenos') || category.includes('alergenos')) {
      console.log('✅ Detectado como INMUNOTERAPIA por categoría')
      return TipoTratamiento.INMUNOTERAPIA
    }
    if (category.includes('vacunas') || category.includes('pediátrica') || category.includes('pediatrica')) {
      console.log('✅ Detectado como VACUNAS_PEDIATRICAS por categoría')
      return TipoTratamiento.VACUNAS_PEDIATRICAS
    }
    if (category.includes('gammaglobulina')) {
      console.log('✅ Detectado como GAMMAGLOBULINA por categoría')
      return TipoTratamiento.GAMMAGLOBULINA
    }
    if (category.includes('pruebas') || category.includes('test')) {
      console.log('✅ Detectado como PRUEBAS por categoría')
      return TipoTratamiento.PRUEBAS
    }
    if (category.includes('consulta')) {
      console.log('✅ Detectado como CONSULTA por categoría')
      return TipoTratamiento.CONSULTA
    }
    if (category.includes('medicamentos')) {
      console.log('✅ Detectado como MEDICAMENTOS_EXTRAS por categoría')
      return TipoTratamiento.MEDICAMENTOS_EXTRAS
    }

    // SEGUNDO: Detectar por nombre del producto
    // Inmunoterapia
    if (name.includes('glicerinado') || name.includes('alxoid') || name.includes('sublingual') || 
        name.includes('alérgeno') || name.includes('alergeno') || name.includes('inmunoterapia')) {
      console.log('✅ Detectado como INMUNOTERAPIA por nombre')
      return TipoTratamiento.INMUNOTERAPIA
    }

    // Vacunas Pediátricas
    if (name.includes('gardasil') || name.includes('vacuna') || name.includes('pediátrica') || 
        name.includes('pediatrica') || name.includes('mmr') || name.includes('prevenar') ||
        name.includes('influenza') || name.includes('hepatitis') || name.includes('varivax') ||
        name.includes('menactra') || name.includes('proquad') || name.includes('pulmovax') ||
        name.includes('rota') || name.includes('vaqta') || name.includes('hexacima') ||
        name.includes('adacel') || name.includes('fiebre') || name.includes('amarilla') ||
        name.includes('herpes')) {
      console.log('✅ Detectado como VACUNAS_PEDIATRICAS por nombre')
      return TipoTratamiento.VACUNAS_PEDIATRICAS
    }

    // Gammaglobulina
    if (name.includes('gammaglobulina') || name.includes('gamma') || name.includes('hizentra') ||
        name.includes('tengeline') || name.includes('higlobin')) {
      console.log('✅ Detectado como GAMMAGLOBULINA por nombre')
      return TipoTratamiento.GAMMAGLOBULINA
    }

    // Pruebas
    if (name.includes('prueba') || name.includes('test') || name.includes('alergia') || 
        name.includes('alex') || name.includes('phadiatop') || name.includes('prick') ||
        name.includes('suero') || name.includes('feno') || name.includes('covid') ||
        name.includes('estreptococo') || name.includes('sincitial') ||
        name.includes('adenovirus') || name.includes('molecular')) {
      console.log('✅ Detectado como PRUEBAS por nombre')
      return TipoTratamiento.PRUEBAS
    }

    // Consulta
    if (name.includes('consulta') || name.includes('cita')) {
      console.log('✅ Detectado como CONSULTA por nombre')
      return TipoTratamiento.CONSULTA
    }

    // Medicamentos Extras
    if (name.includes('bacmune') || name.includes('transferón') || name.includes('transferon') ||
        name.includes('diprospán') || name.includes('diprospan') || name.includes('nebulización') ||
        name.includes('nebulizacion')) {
      console.log('✅ Detectado como MEDICAMENTOS_EXTRAS por nombre')
      return TipoTratamiento.MEDICAMENTOS_EXTRAS
    }

    // Por defecto, asignar a Medicamentos Extras
    console.log('⚠️ No se pudo detectar el tipo específico, asignando a MEDICAMENTOS_EXTRAS por defecto')
    return TipoTratamiento.MEDICAMENTOS_EXTRAS
  }

  const handleProductSelect = async (product: any) => {
    console.log('🔍 Producto seleccionado:', product.name, 'Categoría:', product.category)
    
    // Detectar el tipo de tratamiento automáticamente
    const detectedType = detectTreatmentType(product.name, product.category)
    
    if (detectedType) {
      console.log('✅ Navegando a:', detectedType)
      // Establecer el tipo de tratamiento detectado
      setValue('tipoTratamiento', detectedType, { shouldValidate: true })
      
      // Validar y navegar al siguiente paso
      const valid = await trigger('tipoTratamiento')
      if (valid) {
        // Pasar información del producto seleccionado al siguiente paso
        localStorage.setItem('selectedProduct', JSON.stringify({
          name: product.name,
          category: product.category,
          id: product.id
        }))
        onNext()
      } else {
        console.log('❌ Error de validación:', errors)
      }
    } else {
      console.log('❌ No se pudo detectar el tipo de tratamiento')
    }
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda rápida de productos */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            Búsqueda Rápida de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductAutocomplete
            onProductSelect={handleProductSelect}
            placeholder="Buscar producto por nombre o categoría..."
            className="mb-3"
          />
                      <p className="text-sm text-gray-600">
              💡 Busca cualquier producto y te llevará al formulario correspondiente con el producto pre-seleccionado
            </p>
        </CardContent>
      </Card>

      {/* Lista de productos agregados */}
      {fields.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800">
              Productos Agregados ({fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex justify-between items-center p-3 bg-white border border-blue-200 rounded-lg">
                                     <div>
                     <span className="font-medium text-gray-800">[{(field as any).categoria || 'Sin categoría'}] {(field as any).nombreProducto}</span>
                     <div className="text-sm text-gray-600">
                       Cantidad: {(field as any).cantidad}
                     </div>
                   </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Separador visual */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-sm text-gray-500 font-medium">O selecciona por tipo de tratamiento</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* Selección de tipo de tratamiento */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Tratamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {Object.values(TipoTratamiento).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => handleSelect(tipo)}
                className={`flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 hover:scale-[1.03] hover:shadow-lg px-4 py-2 text-lg font-semibold gap-2
                  ${tipoTratamiento === tipo ? 'bg-gray-800 text-white border-primary ring-2 [--tw-ring-color:rgb(var(--primary)/0.3)] shadow-[0_0_0_4px_rgb(var(--primary)/0.2)]' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                {treatmentIcons[tipo]}
                <span>{treatmentLabels[tipo]}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <Button onClick={onBack} variant="outline" type="button" className="text-white border-white hover:bg-white hover:text-gray-800">Atrás</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 