"use client"
import { useState } from 'react'
import { InventoryMetrics } from './InventoryMetrics'
import { CategoryProductsModal } from './CategoryProductsModal'
import { StockAlertsModal } from './StockAlertsModal'
import { AlertTriangle } from 'lucide-react'
import type { CategoryInventoryDto, ProductInventoryDto } from '@/types/inventario-dashboard'
import { SmartNumber } from '@/components/ui/smart-number'

interface InventoryMetricsWithModalProps {
  inventoryByCategory: CategoryInventoryDto[]
  totalProductsByCategory: CategoryInventoryDto[]
  inventory?: ProductInventoryDto[]
  lowStockAlerts: ProductInventoryDto[]
}

export function InventoryMetricsWithModal({ 
  inventoryByCategory, 
  totalProductsByCategory, 
  inventory = [],
  lowStockAlerts = []
}: InventoryMetricsWithModalProps) {
  const [modalState, setModalState] = useState<{ 
    open: boolean, 
    category: string | null, 
    products: ProductInventoryDto[] 
  }>({ 
    open: false, 
    category: null, 
    products: [] 
  })
  const [stockModalOpen, setStockModalOpen] = useState(false)

  function handleCategoryClick(category: string) {
    const productsInCategory = inventory.filter(p => (p.category || 'Sin categoría') === category)
    setModalState({ open: true, category, products: productsInCategory })
  }

  function handleCloseModal() {
    setModalState({ ...modalState, open: false })
  }

  return (
    <div className="space-y-6">
      {/* Inventario por Categoría con interactividad */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-100">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Inventario por Categoría</h2>
            <p className="text-gray-600">Haz clic para ver el detalle de productos</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(inventoryByCategory || []).map((category, index) => (
            <button
              key={index}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => handleCategoryClick(category.category)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{category.category}</h3>
                <span className="text-sm text-gray-500">{category.totalProducts} productos</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                <SmartNumber value={category.totalValue} isCurrency={true} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Resto de métricas sin interactividad */}
      <InventoryMetrics 
        inventoryByCategory={inventoryByCategory}
        totalProductsByCategory={totalProductsByCategory}
        inventory={inventory}
      />

      {/* Modal de detalle por categoría */}
      <CategoryProductsModal
        open={modalState.open}
        category={modalState.category}
        products={modalState.products}
        onClose={handleCloseModal}
      />
    </div>
  )
} 