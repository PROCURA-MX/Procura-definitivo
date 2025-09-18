import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, Calendar, AlertTriangle } from 'lucide-react'
import type { ImmobilizedInventoryDto } from '@/types/dashboard'

interface ImmobilizedInventoryCardProps {
  data: ImmobilizedInventoryDto[]
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function ImmobilizedInventoryCard({ data }: ImmobilizedInventoryCardProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)
  const averageDays = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.daysWithoutMovement, 0) / data.length)
    : 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inventario Inmovilizado</h3>
          <p className="text-sm text-gray-600">Productos sin movimiento reciente</p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-lg font-semibold text-gray-900">{currency.format(totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio Días</p>
              <p className="text-lg font-semibold text-gray-900">{averageDays} días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-l-4 border-orange-500">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-600">
                  Último movimiento: {new Date(item.lastMovement).toLocaleDateString('es-MX')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currency.format(item.value)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">Cantidad: {item.quantity}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.daysWithoutMovement > 365 
                      ? 'bg-red-100 text-red-700' 
                      : item.daysWithoutMovement > 180
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.daysWithoutMovement} días
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {data.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Y {data.length - 5} productos más...
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 