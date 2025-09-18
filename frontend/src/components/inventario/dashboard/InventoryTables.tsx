import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react'
import type { 
  DashboardResponseDto, 
  CategoryInventoryDto,
  MostUsedProductDto,
  MovementDto,
  ImmobilizedInventoryDto,
  ExpirationAlertDto
} from '@/types/dashboard'

interface InventoryTablesProps {
  data: DashboardResponseDto
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function InventoryTables({ data }: InventoryTablesProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Productos Más Usados */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Usados</h3>
            <p className="text-sm text-gray-600">Productos con mayor actividad</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="space-y-3">
            {data.mostUsedProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.productName}</p>
                  <p className="text-sm text-gray-600">Salidas: {Number(product.totalExits).toFixed(2)} | Usos: {Number(product.totalUsage).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  {product.totalExits > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {Number(product.totalExits).toFixed(2)} {
                        ['Alérgenos', 'Alérgenos Alxoid', 'Diluyentes'].includes(product.category) 
                          ? 'ml usados' 
                          : 'salidas'
                      }
                    </span>
                  )}
                  {product.totalUsage > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {Number(product.totalUsage).toFixed(2)} usos
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Movimientos Recientes</h3>
            <p className="text-sm text-gray-600">Últimas actividades del inventario</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="space-y-3">
            {data.recentMovements.slice(0, 5).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{movement.productName}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(movement.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {movement.quantity}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    movement.type === 'ENTRY' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {movement.type === 'ENTRY' ? 'Entrada' : 'Salida'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {data.lowStockAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stock Bajo</h3>
              <p className="text-sm text-gray-600">Productos con inventario mínimo</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-3">
              {data.lowStockAlerts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Cantidad: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{currency.format(product.totalValue)}</p>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Stock bajo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alertas de Expiración */}
      {data.expirationAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Próximos a Expirar</h3>
              <p className="text-sm text-gray-600">Productos con fecha de vencimiento cercana</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-3">
              {data.expirationAlerts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border-l-4 border-orange-500">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.productName}</p>
                    <p className="text-sm text-gray-600">
                      Expira: {new Date(product.expiryDate).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Cantidad: {product.quantity}</p>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Próximo a expirar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 