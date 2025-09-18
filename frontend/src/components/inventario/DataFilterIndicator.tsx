import { Calendar, Clock, TrendingUp, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DataFilterIndicatorProps {
  hasDateFilter: boolean
  dateRange?: string
  isCurrentData: boolean
  className?: string
}

export function DataFilterIndicator({
  hasDateFilter,
  dateRange,
  isCurrentData,
  className = ''
}: DataFilterIndicatorProps) {
  if (!hasDateFilter) return null

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <span className="text-gray-500">Período:</span> <span className="font-medium text-gray-700">{dateRange}</span>
    </div>
  )
}

// Componente para mostrar qué métricas cambian vs cuáles se mantienen actuales
export function MetricsLegend() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Leyenda de Métricas</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Cambian con filtro de fechas
          </h5>
          <ul className="space-y-1 text-gray-600">
            <li>• Inventario utilizado/ingresado</li>
            <li>• Total de salidas/entradas</li>
            <li>• Costos por período</li>
            <li>• Movimientos por categoría</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Siempre actuales
          </h5>
          <ul className="space-y-1 text-gray-600">
            <li>• Valor total del inventario</li>
            <li>• Alertas de stock bajo</li>
            <li>• Alertas de vencimiento</li>
            <li>• Productos más usados</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
