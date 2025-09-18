"use client";

import React, { useState, useEffect } from 'react'
import SupplierAutocomplete from './SupplierAutocomplete'
import NewProductForm from './NewProductForm'
import { ProductAutocomplete } from '../ProductAutocomplete'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModernDatePicker } from '@/components/ui/modern-date-picker'

import { Search, Plus, List } from 'lucide-react'
import api from '../../../services/api'
import { notifyChange } from '@/lib/sync-utils'
import { getCurrentUserSedeId } from '@/utils/sedeMapping'
import { useConsultorioContext } from '@/contexts/ConsultorioContext'
import { useConsultorioSedeMapping } from '../../../hooks/useConsultorioSedeMapping'

// Categorías y productos según base de datos
const PRODUCT_CATEGORIES = [
  {
    name: 'Alérgenos',
    products: [
      'Abedul', 'Ácaros', 'Álamo del este', 'Alheña', 'Ambrosía', 'Caballo', 'Camarón', 
      'Ciprés de Arizona', 'Encino', 'Fresno blanco', 'Gato', 'Manzana', 'Mezcla cucarachas', 
      'Mezcla pastos', 'Mezquite', 'Perro', 'Pescado varios', 'Pino blanco', 'Pistache', 
      'Sweet gum', 'Trueno', 'Bacteriana', 'Cucaracha', 'Estreptococo B', 'Glicerinado Bacteriana',
      'Glicerinado Frasco #1', 'Glicerinado Frasco #2', 'Glicerinado Frasco #3', 'Glicerinado Frasco #4',
      'Glicerinado Frasco #5', 'Glicerinado Frasco #6', 'Glicerinado por Frasco', 'Glicerinado por Unidad',
      'Sublingual', 'Sublingual Frasco 1', 'Sublingual Frasco 2', 'Sublingual Frasco 3', 'Sublingual Frasco 4'
    ],
  },
  {
    name: 'Alérgenos Alxoid',
    products: [
      '6 Gramíneas A', '6 Gramíneas B', 'Ácaros A', 'Ácaros B', 'Ambrosía A', 'Ambrosía B',
      'Cupressus Arizónica A', 'Cupressus Arizónica B', 'Encino A', 'Encino B', 'Fresno A', 'Fresno B',
      'Gato A', 'Gato B', 'Gramínea con sinodon A', 'Gramínea con sinodon B', 'Perro A', 'Perro B',
      'Sinodon A', 'Sinodon B', 'Alxoid Tipo A', 'Alxoid Tipo B', 'Alxoid Tipo B.2'
    ],
  },
  {
    name: 'Gammaglobulina',
    products: [
      'HIGLOBIN 10GR', 'Hizentra 2GR', 'Hizentra 4GR', 'TENGELINE 10% 5G/50ML', 'TENGELINE 10G/100ML'
    ],
  },
  {
    name: 'Medicamentos',
    products: [
      'Bacmune', 'Diprospán', 'Nebulización', 'Transferón', 'Suero'
    ],
  },
  {
    name: 'Pruebas',
    products: [
      'ALEX Molecular', 'Evans', 'Influenza A y B / Sincitial / Adenovirus', 'Phadiatop',
      'Prick to Prick', 'Pruebas con Alimentos', 'VITS', 'Prick', 'Producto de Prueba', 'FeNO'
    ],
  },
  {
    name: 'Servicios',
    products: [
      'Consulta', 'test-product'
    ],
  },
  {
    name: 'Vacunas Pediátricas',
    products: [
      'Adacel Boost', 'Fiebre Amarilla', 'Gardasil', 'Gardasil 9', 'Hepatitis A y B', 'Herpes Zóster',
      'Hexacima', 'Influenza', 'Menactra', 'MMR', 'Prevenar 13 V', 'Proquad', 'Pulmovax', 'Rota Teq', 
      'Vaqta', 'Varicela', 'Varivax', 'COVID', 'COVID/Influenza', 'Covid-19', 'Polio', 'Sarampión', 
      'Tetanos', 'Tos ferina', 'Fiebre Roja'
    ],
  },
  {
    name: 'Diluyentes',
    products: [
      'Evans', 'VITS', 'Bacteriana'
    ],
  },
];

interface Product {
  id: string
  name: string
}

interface EntryProduct {
  category: string
  name: string
  productId: string
  quantity: number // Cantidad original del formulario (frascos) - para cálculo de valor
  price: number
  expiry?: string
  mlPerVial?: number // Solo para Alxoid, Alérgenos y Diluyentes
  totalMl?: number // Total de ml calculado (quantity * mlPerVial) - para mostrar en tabla
}

type ProductSelectionMode = 'existing' | 'new' | null;

// Función para obtener el ID real del usuario autenticado
function getCurrentUserId(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.id) {
      return user.id
    }
    
    // Fallback: obtener del token JWT
    const token = localStorage.getItem('token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub || payload.id || 'default-user-id'
    }
    
    return 'default-user-id'
  } catch (error) {
    console.error('Error obteniendo userId:', error)
    return 'default-user-id'
  }
}

export default function InventoryEntryForm() {
  // Obtener el consultorio seleccionado del contexto
  const { selectedConsultorioId, consultorios } = useConsultorioContext()
  
  // Obtener el mapeo dinámico de consultorios a sedes
  const { getSedeIdFromConsultorio, loading: mappingLoading } = useConsultorioSedeMapping()
  
  // Verificar si el usuario puede cambiar consultorio (solo doctores con múltiples consultorios)
  const canChangeConsultorio = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const userRole = user.rol || 'USER'
      const userConsultorioId = user.consultorio_id
      
      // Solo doctores pueden cambiar consultorio
      if (userRole !== 'DOCTOR') return false
      
      // Si está en "todos los consultorios", SIEMPRE permitir selección
      if (selectedConsultorioId === 'todos') return true
      
      // Si el usuario tiene un consultorio asignado, no puede cambiar
      if (userConsultorioId) return false
      
      // Si hay múltiples consultorios disponibles, puede cambiar
      return consultorios.length > 1
    } catch (error) {
      return false
    }
  }
  
  // Estado para consultorio específico en formulario (cuando está en "todos")
  const [formConsultorioId, setFormConsultorioId] = useState<string>('')
  
  // AUTO-SELECCIONAR el primer consultorio disponible cuando está en "todos" SOLO si hay 1 consultorio
  useEffect(() => {
    if (selectedConsultorioId === 'todos' && consultorios.length > 0 && !formConsultorioId) {
      // ✅ ARREGLADO: Solo auto-seleccionar si hay exactamente 1 consultorio
      if (consultorios.length === 1) {
        const firstConsultorio = consultorios[0]
        if (firstConsultorio) {
          console.log('🔧 AUTO-SELECCIONANDO consultorio (1 solo disponible):', firstConsultorio.nombre)
          setFormConsultorioId(firstConsultorio.id)
        }
      } else {
        // ✅ ARREGLADO: Si hay múltiples consultorios, NO auto-seleccionar
        console.log('🔧 MÚLTIPLES CONSULTORIOS - Forzando selección manual del usuario')
        setFormConsultorioId('') // Dejar vacío para forzar selección
      }
    }
  }, [selectedConsultorioId, consultorios, formConsultorioId])
  
  // Determinar si necesitamos forzar selección de consultorio
  const needsConsultorioSelection = (selectedConsultorioId === 'todos' && canChangeConsultorio()) && !formConsultorioId
  
  // Obtener el sedeId basado en el consultorio seleccionado
  // ARREGLO: Usar formConsultorioId si está disponible, sino selectedConsultorioId
  const effectiveConsultorioId = formConsultorioId || selectedConsultorioId
  const sedeId = getSedeIdFromConsultorio(effectiveConsultorioId || 'todos')
  
  // DEBUG: Logging para verificar la lógica
  console.log('🔍 DEBUG - Lógica de selección forzada:', {
    selectedConsultorioId,
    canChangeConsultorio: canChangeConsultorio(),
    needsConsultorioSelection,
    formConsultorioId,
    effectiveConsultorioId,
    sedeId
  })
  
  // DEBUG: Logging para verificar la lógica
  console.log('🔍 DEBUG - Lógica de selección forzada:', {
    selectedConsultorioId,
    canChangeConsultorio: canChangeConsultorio(),
    needsConsultorioSelection,
    formConsultorioId,
    effectiveConsultorioId
  })
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState<string>('1')
  const [price, setPrice] = useState<string>('0')
  const [expiry, setExpiry] = useState('')
  const [mlPerVial, setMlPerVial] = useState<string>('')
  const [entryProducts, setEntryProducts] = useState<EntryProduct[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productSelectionMode, setProductSelectionMode] = useState<ProductSelectionMode>(null)
  const [showNewProductForm, setShowNewProductForm] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory)
    }
  }, [selectedCategory])

  async function fetchProducts() {
    try {
              const res = await api.get('/inventory/products')
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setSaveMessage('Error al cargar productos. Intenta recargar la página.')
    }
  }

  async function fetchProductsByCategory(categoryName: string) {
    try {
              const res = await api.get(`/inventory/products/category/${encodeURIComponent(categoryName)}`)
      console.log(`Productos recibidos para categoría "${categoryName}":`, res.data)
      setProducts(res.data)
    } catch (error) {
      console.error('Error fetching products by category:', error)
      setSaveMessage(`Error al cargar productos de la categoría "${categoryName}". Intenta recargar la página.`)
      // Fallback a productos hardcodeados si hay error
      const currentCategory = PRODUCT_CATEGORIES.find(c => c.name === categoryName)
      if (currentCategory) {
        const fallbackProducts = currentCategory.products.map((name, index) => ({
          id: `fallback-${index}`,
          name
        }))
        setProducts(fallbackProducts)
      }
    }
  }

  const currentCategory = PRODUCT_CATEGORIES.find(c => c.name === selectedCategory)
  const isAlxoid = selectedCategory === 'Alérgenos Alxoid'
  
  // ✅ SOLUCIÓN ROBUSTA: Función para determinar si necesita cálculo de ML
  const needsMlCalculation = (category: string) => {
    const mlCategories = ['Alérgenos Alxoid', 'Alérgenos', 'Diluyentes']
    return mlCategories.includes(category)
  }

  // Map product name to id
  function getProductIdByName(name: string) {
    const availableProducts = getAvailableProducts()
    console.log('🔍 DEBUG - getProductIdByName - name:', name)
    console.log('🔍 DEBUG - getProductIdByName - availableProducts:', availableProducts)
    const found = availableProducts.find(p => p.name === name)
    console.log('🔍 DEBUG - getProductIdByName - found:', found)
    return found ? found.id : ''
  }

  function handleProductCreated(newProduct: { id: string; name: string }) {
    // Recargar productos de la categoría actual para incluir el nuevo
    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory)
    }
    
    // Seleccionar automáticamente el nuevo producto
    setSelectedProduct(newProduct.name)
    setSelectedProductId(newProduct.id)
    
    // Ocultar el formulario de nuevo producto
    setShowNewProductForm(false)
    setProductSelectionMode('existing')
    
    // Limpiar el formulario de nuevo producto
    setPrice('0')
  }

  function handleAddProduct() {
    
    if (!selectedCategory || !selectedProduct) {
      console.log('❌ DEBUG - Falta categoría o producto')
      console.log('❌ DEBUG - selectedCategory:', selectedCategory)
      console.log('❌ DEBUG - selectedProduct:', selectedProduct)
      alert('Por favor, selecciona una categoría y un producto antes de continuar.')
      return
    }
    if (!quantity || Number(quantity) <= 0 || !price || Number(price) <= 0) {
      console.log('❌ DEBUG - Cantidad o precio inválido')
      return
    }
    
    const productId = selectedProductId || getProductIdByName(selectedProduct)
    console.log('🔍 DEBUG - productId final:', productId)
    
    if (!productId) {
      console.log('❌ DEBUG - No se pudo obtener productId')
      alert('Error: No se pudo obtener el ID del producto. Por favor, selecciona el producto nuevamente.')
      return
    }
    const newProduct = {
      category: selectedCategory,
      name: selectedProduct,
      productId,
      quantity: Number(quantity), // ✅ ARREGLO: Siempre guardar la cantidad original del formulario (frascos)
      price: Number(price), // Precio por frasco
      expiry: expiry || undefined,
      mlPerVial: needsMlCalculation(selectedCategory) ? Number(mlPerVial) : undefined,
      totalMl: needsMlCalculation(selectedCategory) ? (() => {
        const result = Number(quantity) * Number(mlPerVial);
        console.log('🔍 CALCULO:', { quantity, mlPerVial, result, selectedCategory });
        return result;
      })() : Number(quantity), // Total de ml calculado o cantidad normal
    }
    
    
    setEntryProducts(prev => [
      ...prev,
      newProduct,
    ])
    setSelectedProduct('')
    setSelectedProductId('')
    setQuantity('1')
    setPrice('0')
    setExpiry('')
    setMlPerVial('')
    setProductSelectionMode(null)
  }

  function handleRemoveProduct(index: number) {
    setEntryProducts(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    // Validación: verificar que el mapping esté cargado
    if (mappingLoading || sedeId === 'loading') {
      setSaveMessage('Esperando a que se cargue la información de consultorios...')
      return
    }

    // Validación: verificar que se haya seleccionado un consultorio cuando está en "todos"
    if (selectedConsultorioId === 'todos' && !formConsultorioId) {
      setSaveMessage('Error: Debes seleccionar un consultorio específico para registrar la entrada.');
      return;
    }
    
    // Validación extra: no permitir productos fallback
    if (entryProducts.some(p => p.productId.startsWith('fallback-'))) {
      setSaveMessage('Error: No puedes registrar productos de prueba o incompletos. Selecciona un producto válido.');
      return;
    }
    setIsSaving(true)
    setSaveMessage(null)
    
    // DEBUG: Verificar qué usuario está logueado
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    console.log('🔍 DEBUG - Usuario logueado:', user)
    console.log('🔍 DEBUG - Email del usuario:', user.email)
            console.log('🔍 DEBUG - userId real:', getCurrentUserId())
    
    try {
      // DEBUG: Verificar el sedeId que se está enviando
      console.log('🔍 DEBUG - Enviando entrada con sedeId:', sedeId)
      console.log('🔍 DEBUG - Consultorio seleccionado:', selectedConsultorioId)
      console.log('🔍 DEBUG - Consultorio efectivo:', effectiveConsultorioId)
      console.log('🔍 DEBUG - Necesita selección:', needsConsultorioSelection)
      console.log('🔍 DEBUG - Consultorio del formulario:', formConsultorioId)
      console.log('🔍 DEBUG - Mapeo de consultorio a sede:', getSedeIdFromConsultorio(effectiveConsultorioId || 'todos'))
      
      // Obtener el sedeId real basado en el consultorio efectivo
      const realSedeId = getSedeIdFromConsultorio(effectiveConsultorioId || 'todos')
      console.log('🔧 ARREGLANDO sedeId:', { sedeId, realSedeId, effectiveConsultorioId })
      
      const res = await api.post('/inventory/inventory-entry/batch', {
        entries: entryProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitCost: p.price,
          mlPerVial: p.mlPerVial, // ✅ Agregar ml por frasco para productos con ml
          totalMl: p.totalMl, // ✅ ARREGLADO: Enviar totalMl al backend
          expiryDate: p.expiry,
          supplierName: 'Proveedor demo', // TODO: integrar proveedor real
          sedeId: realSedeId, // ✅ ARREGLADO: Usar el sedeId real
          consultorioId: effectiveConsultorioId, // ✅ AGREGADO: Enviar consultorioId como en las salidas
          userId: getCurrentUserId(),
        })),
        entryDate: new Date().toISOString(),
      })
      setSaveMessage('¡Entrada registrada exitosamente!')
      setEntryProducts([])
      // Notificar a otros componentes sobre el cambio
      notifyChange('INVENTARIO')
    } catch (err) {
      console.error('Error en handleSave:', err)
      setSaveMessage('Error al registrar entrada: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSaving(false)
    }
  }

  function resetProductSelection() {
    setSelectedProduct('')
    setSelectedProductId('')
    setProductSelectionMode(null)
    setShowNewProductForm(false)
  }

  // Obtener productos para mostrar en el selector
  function getAvailableProducts() {
    console.log('getAvailableProducts - products:', products)
    console.log('getAvailableProducts - selectedCategory:', selectedCategory)
    
    // Si hay productos dinámicos, usarlos
    if (products.length > 0) {
      console.log('Usando productos dinámicos:', products.length)
      return products
    }
    
    // Fallback a productos hardcodeados
    const currentCategory = PRODUCT_CATEGORIES.find(c => c.name === selectedCategory)
    if (currentCategory) {
      const fallbackProducts = currentCategory.products.map((name, index) => ({
        id: `fallback-${index}`,
        name
      }))
      console.log('Usando productos fallback:', fallbackProducts.length)
      return fallbackProducts
    }
    
    console.log('No hay productos disponibles')
    return []
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Agregar productos a la entrada</h2>
      
      {/* Selector de consultorio forzado cuando está en "todos" */}
      {(selectedConsultorioId === 'todos' || needsConsultorioSelection) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-orange-800 mb-2">
            ⚠️ Selecciona un consultorio específico
          </label>
          <select 
            value={formConsultorioId} 
            onChange={(e) => setFormConsultorioId(e.target.value)}
            className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-900 bg-white"
            required
          >
            <option value="">-- Selecciona un consultorio --</option>
            {consultorios.map(consultorio => (
              <option key={consultorio.id} value={consultorio.id}>
                {consultorio.nombre}
              </option>
            ))}
          </select>
          <p className="text-xs text-orange-600 mt-1">
            📍 Debes seleccionar un consultorio específico para registrar la entrada
          </p>
        </div>
      )}
      
      {/* Selector de consultorio (solo para doctores con múltiples consultorios) */}
      {canChangeConsultorio() && selectedConsultorioId !== 'todos' && !needsConsultorioSelection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Consultorio de destino
          </label>
          <select 
            value={selectedConsultorioId || ''} 
            onChange={(e) => {
              // Aquí necesitaríamos actualizar el contexto, pero por ahora solo mostramos
              console.log('Consultorio seleccionado:', e.target.value)
            }}
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 bg-white"
          >
            {consultorios.map(consultorio => (
              <option key={consultorio.id} value={consultorio.id}>
                {consultorio.nombre}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-600 mt-1">
            📍 Registrando entrada en: <strong>{consultorios.find(c => c.id === selectedConsultorioId)?.nombre || 'Consultorio Principal'}</strong>
          </p>
        </div>
      )}
      
      {/* Mostrar consultorio fijo para usuarios que no pueden cambiar */}
      {!canChangeConsultorio() && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            📍 <strong>Consultorio:</strong> {consultorios.find(c => c.id === selectedConsultorioId)?.nombre || 'Consultorio Principal'}
          </p>
        </div>
      )}
      
      {/* Búsqueda rápida de productos */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Búsqueda Rápida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductAutocomplete
            onProductSelect={(product) => {
              // Auto-completar el formulario con el producto seleccionado
              setSelectedCategory(product.category)
              setSelectedProduct(product.name)
              setSelectedProductId(product.id)
              setPrice(product.costPerUnit.toString())
              setProductSelectionMode('existing')
            }}
            placeholder="Buscar producto por nombre o categoría..."
            className="mb-3"
          />
          <p className="text-sm text-gray-600">
            💡 Busca cualquier producto y se auto-completará el formulario
          </p>
        </CardContent>
      </Card>

      {/* Separador visual */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-sm text-gray-500 font-medium">O selecciona manualmente</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>
      
      {/* Selección de categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
        <select 
          value={selectedCategory} 
          onChange={e => {
            setSelectedCategory(e.target.value)
            resetProductSelection()
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">Selecciona una categoría</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Selección de producto */}
      {selectedCategory && !showNewProductForm && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
          
          {/* Botones de selección de modo */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setProductSelectionMode('existing')}
              className={`px-3 py-1 text-sm rounded-md ${
                productSelectionMode === 'existing' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Producto Existente
            </button>
            <button
              type="button"
              onClick={() => {
                setProductSelectionMode('new')
                setShowNewProductForm(true)
              }}
              className={`px-3 py-1 text-sm rounded-md ${
                productSelectionMode === 'new' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Nuevo Producto
            </button>
          </div>

          {/* Selector de producto existente */}
          {productSelectionMode === 'existing' && (
            <select 
              value={selectedProduct} 
              onChange={e => {
                const selectedName = e.target.value
                setSelectedProduct(selectedName)
                const productId = getProductIdByName(selectedName)
                console.log('🔍 DEBUG - Producto seleccionado:', selectedName, 'ID:', productId)
                setSelectedProductId(productId)
                
                // Auto-establecer la categoría si no está seleccionada
                if (!selectedCategory && selectedName) {
                  const foundCategory = PRODUCT_CATEGORIES.find(cat => 
                    cat.products.includes(selectedName)
                  )
                  if (foundCategory) {
                    console.log('🔍 DEBUG - Auto-estableciendo categoría:', foundCategory.name)
                    setSelectedCategory(foundCategory.name)
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Selecciona un producto</option>
              {getAvailableProducts().map(prod => (
                <option key={prod.id} value={prod.name}>{prod.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Formulario de nuevo producto */}
      {showNewProductForm && (
        <NewProductForm
          onProductCreated={handleProductCreated}
          onCancel={() => setShowNewProductForm(false)}
          selectedCategory={selectedCategory}
          // Pasar datos adicionales para auto-entrada
          quantity={Number(quantity) || undefined}
          price={Number(price) || undefined}
          mlPerVial={needsMlCalculation(selectedCategory) ? Number(mlPerVial) || undefined : undefined}
          expiryDate={expiry || undefined}
          sedeId={sedeId !== 'loading' ? sedeId : undefined}
          consultorioId={effectiveConsultorioId || undefined}
          userId={getCurrentUserId()}
        />
      )}

      {/* Campos de entrada para producto seleccionado */}
      {selectedProduct && !showNewProductForm && (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-800">Detalles del producto: {selectedProduct}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input 
                type="number" 
                min={1} 
                value={quantity}
                onChange={e => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            
            {needsMlCalculation(selectedCategory) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ml por frasco</label>
                <input 
                  type="number" 
                  min={1} 
                  value={mlPerVial}
                  onChange={e => setMlPerVial(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
              <input 
                type="number" 
                min={0} 
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caducidad (opcional)</label>
              <ModernDatePicker
                selected={expiry ? new Date(expiry) : null}
                onChange={(date) => setExpiry(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Seleccionar fecha de caducidad"
                enableQuickNavigation={true}
                className="w-full"
              />
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleAddProduct}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Agregar al resumen
          </button>
        </div>
      )}

      {/* Resumen de productos */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen de productos</h3>
        {entryProducts.length === 0 && (
          <p className="text-gray-500 italic">No hay productos agregados.</p>
        )}
        <ul className="space-y-2">
          {entryProducts.map((prod, i) => (
            <li key={i} className="flex justify-between items-center p-3 bg-white border rounded-lg">
              <div>
                <span className="font-medium text-gray-800">[{prod.category}] {prod.name}</span>
                <div className="text-sm text-gray-600">
                  Cantidad: {prod.totalMl || prod.quantity} {prod.totalMl ? 'ml' : 'frascos'} — Precio Unitario: ${prod.price}/frasco
                  {prod.expiry && ` — Caducidad: ${prod.expiry}`}
                  {prod.mlPerVial && ` — ml/frasco: ${prod.mlPerVial}`}
                  {prod.totalMl && ` — Frascos: ${prod.quantity}`}
                  {prod.totalMl && ` — Valor Total: $${(prod.quantity * prod.price).toFixed(2)}`}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleRemoveProduct(i)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón de guardar */}
      {entryProducts.length > 0 && (
        <button 
          type="button" 
          onClick={handleSave} 
          disabled={isSaving || mappingLoading || sedeId === 'loading' || entryProducts.some(p => p.productId.startsWith('fallback-'))}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {isSaving ? 'Guardando...' : 'Registrar entrada'}
        </button>
      )}

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className={`p-3 rounded-md mt-4 ${
          saveMessage.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {saveMessage}
        </div>
      )}
    </div>
  )
} 