"use client"

import { useState } from 'react'
import { DollarSign, Package, AlertTriangle, Clock } from 'lucide-react'
import { StockAlertsModal } from './StockAlertsModal'
import type { ProductInventoryDto, ExpirationAlertDto } from '@/types/inventario-dashboard'
import { useNavigate } from 'react-router-dom'
import { SmartNumber } from '@/components/ui/smart-number'
import { ExactValueDisplay } from '@/components/ui/exact-value-display'
import { PreciseValueDisplay } from '@/components/ui/precise-value-display'

interface DashboardMetricsProps {
  totalInventoryValue: number
  totalUsedInventoryCost: number
  totalEnteredInventoryCost: number
  lowStockAlerts: ProductInventoryDto[]
  lowStockAlertsCount?: number // 🚀 CORREGIDO: Conteo real de alertas
  expirationAlerts: ExpirationAlertDto[]
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function DashboardMetrics({ totalInventoryValue, totalUsedInventoryCost, totalEnteredInventoryCost, lowStockAlerts, lowStockAlertsCount, expirationAlerts }: DashboardMetricsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [expirationModalOpen, setExpirationModalOpen] = useState(false)
  const navigate = useNavigate()

  // 🔍 DEBUG: Log de valores recibidos del backend
  console.log('🔍 [DashboardMetrics] Valores recibidos del backend:', {
    totalInventoryValue,
    totalUsedInventoryCost,
    totalEnteredInventoryCost,
    lowStockAlerts: lowStockAlerts?.length || 0,
    lowStockAlertsCount: lowStockAlertsCount || 0, // 🚀 CORREGIDO: Conteo real
    expirationAlerts: expirationAlerts?.length || 0
  })
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8 mb-8">
        <div className="bg-blue-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[150px] animate-fade-in">
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/20 mb-3">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-4xl font-extrabold leading-tight drop-shadow-sm text-center">
            <PreciseValueDisplay value={totalInventoryValue} isCurrency={true} className="text-white" showToggle={true} />
          </div>
          <div className="text-blue-100 text-lg font-semibold mt-2 text-center">Valor Total</div>
        </div>
        <button
          className="bg-slate-600 hover:bg-slate-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[150px] animate-fade-in focus:outline-none hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/inventario/Salida')}
          type="button"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/20 mb-3">
            <Package className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-4xl font-extrabold leading-tight drop-shadow-sm text-center">
            <PreciseValueDisplay value={totalUsedInventoryCost} isCurrency={true} className="text-white" showToggle={true} />
          </div>
          <div className="text-slate-100 text-lg font-semibold mt-2 text-center">Inventario Utilizado</div>
        </button>
        <button
          className="bg-emerald-700 hover:bg-emerald-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[150px] animate-fade-in focus:outline-none hover:scale-105 transition-transform duration-200"
          onClick={() => navigate('/inventario/Entrada')}
          type="button"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/20 mb-3">
            <Package className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-4xl font-extrabold leading-tight drop-shadow-sm text-center">
            <PreciseValueDisplay value={totalEnteredInventoryCost} isCurrency={true} className="text-white" showToggle={true} />
          </div>
          <div className="text-emerald-100 text-lg font-semibold mt-2 text-center">Inventario Ingresado</div>
        </button>
        <div
          className="bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[150px] hover:scale-105 transition-transform duration-200 animate-fade-in cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/20 mb-3">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-4xl font-extrabold leading-tight drop-shadow-sm text-center">
            {lowStockAlertsCount || lowStockAlerts?.length || 0}
          </div>
          <div className="text-amber-100 text-lg font-semibold mt-2 text-center">Alertas de Stock Bajo</div>
        </div>
        <button
          className="bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[150px] animate-fade-in focus:outline-none hover:scale-105 transition-transform duration-200"
          onClick={() => setExpirationModalOpen(true)}
          type="button"
        >
          <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white/20 mb-3">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <div className="text-white text-4xl font-extrabold leading-tight drop-shadow-sm text-center">
            {expirationAlerts?.length || 0}
          </div>
          <div className="text-rose-100 text-lg font-semibold mt-2 text-center">Alertas de Vencimiento</div>
        </button>
      </div>
      <StockAlertsModal
        open={modalOpen}
        products={lowStockAlerts}
        onClose={() => setModalOpen(false)}
      />
      <StockAlertsModal
        open={expirationModalOpen}
        products={(expirationAlerts || []).map(e => ({ 
          name: e.productName || 'Producto desconocido', 
          quantity: e.quantity, 
          category: e.category || 'Sin categoría', 
          expiryDate: e.expiryDate ? new Date(e.expiryDate).toISOString() : undefined,
          isExpired: e.isExpired,
          isExpiringSoon: e.isExpiringSoon,
          status: e.status,
          daysUntilExpiry: e.daysUntilExpiry
        }))}
        onClose={() => setExpirationModalOpen(false)}
        title="Productos por Caducar"
        isExpiration
      />
    </>
  )
} 
          expiryDate: e.expiryDate ? new Date(e.expiryDate).toISOString() : undefined,
          isExpired: e.isExpired,
          isExpiringSoon: e.isExpiringSoon,
          status: e.status,
          daysUntilExpiry: e.daysUntilExpiry
        }))}
        onClose={() => setExpirationModalOpen(false)}
        title="Productos por Caducar"
        isExpiration
      />
    </>
  )
} 