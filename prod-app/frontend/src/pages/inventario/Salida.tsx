'use client'
import InventoryExitForm from '@/components/inventario/inventory-exit-steps/InventoryExitForm'
import { CollapsibleDateFilter } from '@/components/inventario/CollapsibleDateFilter'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/inventario/ui/card'
import { Button } from '@/components/inventario/ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../../services/conceptosService' // Importar para aplicar interceptores
import { CategoryDetailModal } from '@/components/inventario/CategoryDetailModal'
import { useCategoryDetailModal } from '@/components/inventario/useCategoryDetailModal'
import { usePersistentDateFilter } from '@/hooks/usePersistentDateFilter'
import { getCurrentUserSedeId } from '@/utils/sedeMapping'
import { DataFilterIndicator } from '@/components/inventario/DataFilterIndicator'
import { useConsultorioContext } from '@/contexts/ConsultorioContext'
import { useConsultorioSedeMapping } from '@/hooks/useConsultorioSedeMapping'

interface ExitByCategory {
  category: string
  totalQuantity: number
  totalValue: number
  products: { name: string; quantity: number; totalValue: number }[]
}

export default function InventoryExitPage() {
  // Obtener el consultorio seleccionado del contexto
  const { selectedConsultorioId } = useConsultorioContext()
  
  // Mapear consultorioId a sedeId usando el hook dinámico
  const { getSedeIdFromConsultorio } = useConsultorioSedeMapping()
  
  const sedeId = getSedeIdFromConsultorio(selectedConsultorioId || 'todos')
  
  // Obtener el primer y último día del mes actual
  const getCurrentMonthRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      from: firstDay.toISOString().split('T')[0], // YYYY-MM-DD
      to: lastDay.toISOString().split('T')[0]     // YYYY-MM-DD
    }
  }
  
  const { from, to, hasActiveFilter } = usePersistentDateFilter(sedeId)
  const [exitsByCategory, setExitsByCategory] = useState<ExitByCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  
  // Hook para el modal de detalles
  const modal = useCategoryDetailModal()

  // Estado para controlar si ya se hizo la petición inicial
  const [hasInitialFetch, setHasInitialFetch] = useState(false)
  
  // 🚀 DETECTAR SI VIENE DESDE EXPEDIENTE Y ABRIR FORMULARIO AUTOMÁTICAMENTE
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const urlPacienteId = searchParams.get('pacienteId')
    const urlPrefillData = searchParams.get('prefillData')
    
    if (urlPacienteId && urlPrefillData) {
      console.log('🚀 [InventoryExitPage] Detectado pre-rellenado desde expediente - abriendo formulario automáticamente')
      setShowForm(true)
      
      // 🎯 SCROLL AUTOMÁTICO HACIA EL FORMULARIO
      setTimeout(() => {
        console.log('📜 [InventoryExitPage] Haciendo scroll automático hacia el formulario...')
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        })
      }, 500) // Pequeño delay para asegurar que el formulario se haya renderizado
    }
  }, [])
  
  useEffect(() => {
    async function fetchExits() {
      console.log('🔄 useEffect - Iniciando fetchExits con:', {
        from,
        to,
        selectedConsultorioId,
        sedeId,
        hasActiveFilter,
        hasInitialFetch
      })
      
      if (!from || !to) {
        console.log('❌ useEffect - Fechas no disponibles, abortando')
        return
      }
      
      // Esperar a que el sedeId esté disponible
      if (sedeId === 'loading' || sedeId === 'not-found') {
        console.log('⏳ useEffect - SedeId no disponible:', sedeId)
        return
      }
      
      // Evitar múltiples peticiones simultáneas
      if (loading) {
        console.log('⏳ useEffect - Ya hay una petición en curso, abortando')
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        let url: string
        
        if (selectedConsultorioId === 'todos') {
          // Para "todos los consultorios", usar un parámetro especial
          url = `/api/inventory/exit/by-category?allConsultorios=true&from=${from}&to=${to}`
        } else {
          // Para consultorio específico
          url = `/api/inventory/exit/by-category?sedeId=${sedeId}&from=${from}&to=${to}`
        }
        
        console.log('🔍 useEffect - Haciendo request a:', url)
        
        const res = await axios.get(url, {
          timeout: 2000 // Reducido a 2 segundos para tablas más rápidas
        })
        
        console.log('✅ useEffect - Datos recibidos:', res.data)
        console.log('✅ useEffect - Cantidad de categorías:', res.data.length)
        
        // Solo actualizar si los datos son válidos
        if (Array.isArray(res.data)) {
          setExitsByCategory(res.data)
          setHasInitialFetch(true)
        } else {
          console.warn('⚠️ useEffect - Datos no válidos:', res.data)
          setExitsByCategory([])
        }
      } catch (err) {
        console.error('❌ useEffect - Error:', err)
        setError('No se pudo cargar el detalle de salidas')
        setExitsByCategory([])
      } finally {
        console.log('🏁 useEffect - Finalizando loading')
        setLoading(false)
      }
    }
    
    // Solo hacer fetch si no se ha hecho inicialmente o si cambian las fechas
    if (!hasInitialFetch || from || to) {
      fetchExits()
    }
  }, [from, to, hasActiveFilter, sedeId]) // Agregué sedeId de vuelta para que se ejecute cuando esté disponible
  
  // useEffect separado para manejar cambios de consultorio
  useEffect(() => {
    if (hasInitialFetch && selectedConsultorioId !== 'todos') {
      console.log('🔄 useEffect - Consultorio cambió, recargando datos:', selectedConsultorioId)
      setHasInitialFetch(false) // Resetear para permitir nueva carga
    }
  }, [selectedConsultorioId])

  // Función para cargar detalles de una categoría
  const handleCategoryClick = useCallback(async (category: string, totalQuantity: number, totalValue: number) => {
    try {
      let url: string
      
      // Siempre usar el mismo parámetro que la tabla principal
      if (selectedConsultorioId === 'todos') {
        url = `/api/inventory/exit/detail/by-category?category=${encodeURIComponent(category)}&allConsultorios=true&from=${from}&to=${to}`
      } else {
        // Para consultorio específico, usar el mismo sedeId que usa la tabla principal
        const consultorioSedeId = getSedeIdFromConsultorio(selectedConsultorioId || '')
        url = `/api/inventory/exit/detail/by-category?category=${encodeURIComponent(category)}&sedeId=${consultorioSedeId}&from=${from}&to=${to}`
      }
      
      const response = await axios.get(url)
      modal.openModal(category, response.data, 'EXIT', totalQuantity, totalValue)
    } catch (error) {
      console.error('Error al cargar detalles de la categoría:', error)
    }
  }, [sedeId, from, to, modal, selectedConsultorioId])

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
      {/* Botón de regreso */}
      <div className="mb-4">
        <Button
          onClick={() => navigate('/inventario')}
          variant="outline"
          className="gap-2 text-base font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Regresar
        </Button>
      </div>
      {/* Filtro de fechas colapsible */}
      <div className="mb-8">
        <CollapsibleDateFilter basePath="/inventario/Salida" sedeId={sedeId} />
        {hasActiveFilter && (
          <DataFilterIndicator
            hasDateFilter={hasActiveFilter}
            dateRange={`${from} a ${to}`}
            isCurrentData={false}
            className="mt-4"
          />
        )}
      </div>
      {/* Resumen de salidas por categoría */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Detalle de Inventario Utilizado por Categoría</h2>
        {(() => {
          console.log('🔍 Render - Estado actual:', {
            loading,
            error,
            exitsByCategoryLength: exitsByCategory.length,
            showTables: !loading && !error && exitsByCategory.length > 0
          })
          
          if (loading) return <div className="text-gray-500">Cargando...</div>
          if (error) return <div className="text-red-500">{error}</div>
          if (!loading && !error && exitsByCategory.length > 0) {
            return (
              <div className="space-y-8">
                {exitsByCategory.map((cat, i) => (
                  <div 
                    key={`${cat.category}-${i}`} 
                    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-200"
                    onClick={() => handleCategoryClick(cat.category, cat.totalQuantity, cat.totalValue)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-2xl text-gray-900">{cat.category}</h3>
                      <span className="text-lg text-gray-500">
                        {cat.totalQuantity.toFixed(2)} {
                          ['Alérgenos', 'Alérgenos Alxoid', 'Diluyentes'].includes(cat.category) 
                            ? 'ml consumidos' 
                            : 'salidas'
                        }
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 mb-2">
                      {(cat.totalValue || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </div>
                    <ul className="text-lg text-gray-800 space-y-1">
                      {cat.products.map((prod, idx) => (
                        <li key={`${prod.name}-${idx}`} className="flex justify-between">
                          <span>{prod.name}</span>
                          <span>{Number(prod.quantity).toFixed(2)} / {(prod.totalValue || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        👆 Haz clic para ver detalles completos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
          return <div className="text-gray-500">No hay datos disponibles</div>
        })()}
      </div>
      {/* Botón para mostrar el formulario de salida */}
      <div className="mb-8 flex justify-center">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="px-8 py-4 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-colors">
            Registrar Salida de Inventario
          </Button>
        )}
      </div>
      {/* Formulario principal y panel lateral, solo visibles si showForm es true */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Información de la Salida</h2>
                <p className="text-gray-600">Completa los datos del paciente y tratamiento</p>
              </div>
              <InventoryExitForm />
            </div>
          </div>
          {/* Panel lateral con información útil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Útil</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">🏥 Tipos de Tratamiento</h4>
                  <ul className="text-base text-blue-800 space-y-1">
                    <li>• Consulta</li>
                    <li>• Inmunoterapia</li>
                    <li>• Vacunas Pediátricas</li>
                    <li>• Gammaglobulina</li>
                    <li>• Pruebas</li>
                    <li>• Medicamentos Extras</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">✅ Proceso</h4>
                  <ul className="text-base text-green-800 space-y-1">
                    <li>1. Datos del paciente</li>
                    <li>2. Tipo de tratamiento</li>
                    <li>3. Productos utilizados</li>
                    <li>4. Observaciones</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">⚠️ Importante</h4>
                  <p className="text-base text-orange-800">
                    Registra cualquier reacción del paciente para seguimiento médico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de detalles de categoría */}
      <CategoryDetailModal
        open={modal.open}
        onClose={modal.closeModal}
        category={modal.category || ''}
        movements={modal.movements}
        type={modal.type}
        totalQuantity={modal.totalQuantity}
        totalValue={modal.totalValue}
        loading={modal.loading}
      />
    </div>
  )
}