'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { InventoryUsageInput, InventoryUsageDetailInput } from '@/schemas/inventory-usage'
import { TipoTratamiento } from '@/types/inventory'
import { InmunoterapiaForm } from './details/InmunoterapiaForm'
import { PruebasForm } from './details/PruebasForm'
import { ConsultaForm } from './details/ConsultaForm'
import { GammaglobulinaForm } from './details/GammaglobulinaForm'
import { VacunasPediatricasForm } from './details/VacunasPediatricasForm'
import { MedicamentosExtrasForm } from './details/MedicamentosExtrasForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ItemsList({ fields, remove }: { fields: any[]; remove: (index: number) => void }) {
  // Función para obtener el nombre del producto basado en el productId
  const getProductName = (productId: string, categoria: string) => {
    // Ahora que todos los formularios envían el nombre del producto directamente,
    // simplemente devolvemos el productId tal como está
    return productId;
  };
  if (fields.length === 0) {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen de productos</h3>
        <p className="text-gray-500 italic">No hay productos agregados.</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen de productos</h3>
      <ul className="space-y-2">
        {fields.map((field, index) => (
          <li key={field.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
            <div>
              <span className="font-medium text-gray-800">[{field.categoria || 'Sin categoría'}] {getProductName(field.productId || field.nombreProducto || '', field.categoria || '')}</span>
              <div className="text-sm text-gray-600">
                Cantidad: {field.cantidad}
                {field.dosis && ` — Dosis: ${field.dosis}`}
                {field.mlPorFrasco && ` — ml/frasco: ${field.mlPorFrasco}`}
                {field.fechaCaducidad && ` — Caducidad: ${field.fechaCaducidad}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const renderDetailForm = (tipo: TipoTratamiento | undefined, append: any, fields: any[], setLocalItemsRef?: any, prefillData?: any) => {
  switch (tipo) {
    case TipoTratamiento.INMUNOTERAPIA:
      return <InmunoterapiaForm append={append} fields={fields} setLocalItemsRef={setLocalItemsRef} prefillData={prefillData} />
    case TipoTratamiento.PRUEBAS:
      return <PruebasForm append={append} />
    case TipoTratamiento.CONSULTA:
      return <ConsultaForm append={append} />
    case TipoTratamiento.GAMMAGLOBULINA:
      return <GammaglobulinaForm append={append} />
    case TipoTratamiento.VACUNAS_PEDIATRICAS:
      return <VacunasPediatricasForm append={append} />
    case TipoTratamiento.MEDICAMENTOS_EXTRAS:
      return <MedicamentosExtrasForm append={append} />
    default:
      return (
        <div className="text-center text-red-600">
          <p>Error: Tipo de tratamiento no seleccionado o no válido.</p>
          <p>Por favor, regrese y seleccione una opción.</p>
        </div>
      )
  }
}

export function DetailsStep() {
  const { control, watch, setValue } = useFormContext<InventoryUsageInput>()
  const tipoTratamiento = watch('tipoTratamiento')
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  
  // 🎯 REFERENCIA PARA ACCEDER A ITEMS LOCALES DESDE EL FORMULARIO PRINCIPAL
  const [localItemsRef, setLocalItemsRef] = useState<any[]>([])
  
  // 🎯 DATOS DE PRE-RELLENADO
  const [prefillData, setPrefillData] = useState<any>(null)
  
  // 🎯 LEER DATOS DE PRE-RELLENADO DESDE URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlPrefillData = searchParams.get('prefillData')
    
    if (urlPrefillData) {
      try {
        const prefillDataParsed = JSON.parse(urlPrefillData)
        console.log('🔍 [DetailsStep] Datos de pre-rellenado recibidos:', prefillDataParsed)
        setPrefillData(prefillDataParsed)
      } catch (error) {
        console.error('❌ [DetailsStep] Error parseando datos de pre-rellenado:', error)
      }
    }
  }, [])
  
  // 🎯 EXPONER REFERENCIA AL FORMULARIO PRINCIPAL
  useEffect(() => {
    // @ts-ignore - Exponer referencia global para acceso desde formulario principal
    window.localItemsRef = setLocalItemsRef
    return () => {
      // @ts-ignore
      delete window.localItemsRef
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Formulario específico del tipo de tratamiento */}
      {renderDetailForm(tipoTratamiento as TipoTratamiento | undefined, append, fields, setLocalItemsRef, prefillData)}
      
      {/* Lista de productos agregados */}
      <ItemsList fields={fields} remove={remove} />
    </div>
  )
} 