import { useState, useMemo, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Search, Filter, Calendar, Package, DollarSign, TrendingUp, X, Download, Loader2 } from 'lucide-react'
import { LoadingSpinner, MovementSkeletonList } from './LoadingSpinner'

interface MovementDetail {
  id: string
  name: string
  quantity: number
  totalValue: number
  unitCost?: number
  batchNumber?: string
  expiryDate?: string
  createdAt: string
  userId?: string
  sedeId?: string
  consultorioId?: string
  consultorioNombre?: string
}

interface CategoryDetailModalProps {
  open: boolean
  onClose: () => void
  category: string
  movements: MovementDetail[]
  type: 'ENTRY' | 'EXIT'
  totalQuantity: number
  totalValue: number
  loading?: boolean
}

export function CategoryDetailModal({
  open,
  onClose,
  category,
  movements,
  type,
  totalQuantity,
  totalValue,
  loading = false
}: CategoryDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'quantity' | 'value'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Filtrar y ordenar movimientos
  const filteredAndSortedMovements = useMemo(() => {
    let filtered = movements.filter(movement => 
      movement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.batchNumber && movement.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Filtro por fecha
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        filtered = filtered.filter(m => new Date(m.createdAt) >= today)
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(m => new Date(m.createdAt) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        filtered = filtered.filter(m => new Date(m.createdAt) >= monthAgo)
        break
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'value':
          comparison = a.totalValue - b.totalValue
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [movements, searchTerm, sortBy, sortOrder, dateFilter])

  // Estadísticas
  const stats = useMemo(() => {
    const total = filteredAndSortedMovements.length
    const totalQty = filteredAndSortedMovements.reduce((sum, m) => sum + m.quantity, 0)
    const totalVal = filteredAndSortedMovements.reduce((sum, m) => sum + m.totalValue, 0)
    const avgValue = total > 0 ? totalVal / total : 0

    return { total, totalQty, totalVal, avgValue }
  }, [filteredAndSortedMovements])

  // Función para exportar datos
  const exportData = () => {
    const csvContent = [
      ['Producto', 'Cantidad', 'Valor Total', 'Fecha', 'Lote', 'Fecha Caducidad'].join(','),
      ...filteredAndSortedMovements.map(m => [
        m.name,
        m.quantity,
        m.totalValue,
        new Date(m.createdAt).toLocaleDateString('es-MX'),
        m.batchNumber || '',
        m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('es-MX') : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${category}_${type}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              type === 'ENTRY' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {type === 'ENTRY' ? (
                <Package className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <p className="text-gray-600 capitalize">
                {type === 'ENTRY' ? 'Entradas' : 'Salidas'} de Inventario
                {!loading && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    ⚡ Cargado desde caché
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filtros y Estadísticas */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-gray-900 placeholder-gray-500 bg-white border-gray-300"
              />
            </div>

            {/* Filtro por fecha */}
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="text-gray-900 bg-white border-gray-300 hover:bg-gray-50">
                <SelectValue placeholder="Filtrar por fecha" className="text-gray-900" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">Todas las fechas</SelectItem>
                <SelectItem value="today" className="text-gray-900 hover:bg-gray-100">Hoy</SelectItem>
                <SelectItem value="week" className="text-gray-900 hover:bg-gray-100">Última semana</SelectItem>
                <SelectItem value="month" className="text-gray-900 hover:bg-gray-100">Último mes</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenar por */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="text-gray-900 bg-white border-gray-300 hover:bg-gray-50">
                <SelectValue placeholder="Ordenar por" className="text-gray-900" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="date" className="text-gray-900 hover:bg-gray-100">Fecha</SelectItem>
                <SelectItem value="name" className="text-gray-900 hover:bg-gray-100">Nombre</SelectItem>
                <SelectItem value="quantity" className="text-gray-900 hover:bg-gray-100">Cantidad</SelectItem>
                <SelectItem value="value" className="text-gray-900 hover:bg-gray-100">Valor</SelectItem>
              </SelectContent>
            </Select>

            {/* Orden */}
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outline"
              className="gap-2 text-gray-900 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            </Button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Registros</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Cantidad Total</p>
                  <p className="text-xl font-bold text-gray-900">{(stats.totalQty || 0).toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(stats.totalVal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Promedio</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${(stats.avgValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

                {/* Tabla de Movimientos */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              {loading ? (
                <div className="py-8">
                  <LoadingSpinner 
                    size="lg" 
                    text="Cargando detalles de la categoría..." 
                    className="mb-6"
                  />
                  <MovementSkeletonList count={8} />
                </div>
              ) : filteredAndSortedMovements.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay movimientos en esta categoría'}
                  </p>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="py-4">
                    <LoadingSpinner 
                      size="md" 
                      text="Cargando movimientos..." 
                      className="mb-4"
                    />
                    <MovementSkeletonList count={3} />
                  </div>
                }>
                  <div className="space-y-4">
                    {filteredAndSortedMovements.map((movement, index) => (
                      <Card key={movement.id || index} className="p-4 hover:shadow-md transition-shadow bg-white border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-center">
                          {/* Producto */}
                          <div className="lg:col-span-2">
                            <h4 className="font-semibold text-gray-900">{movement.name}</h4>
                            {movement.batchNumber && (
                              <Badge variant="secondary" className="mt-1 bg-gray-200 text-gray-800 border-gray-300">
                                Lote: {movement.batchNumber}
                              </Badge>
                            )}
                          </div>

                          {/* Cantidad */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Cantidad</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {(movement.quantity || 0).toFixed(2)}
                            </p>
                          </div>

                          {/* Valor */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-lg font-semibold text-green-600">
                              ${(movement.totalValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>

                          {/* Consultorio */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Consultorio</p>
                            <p className="text-sm font-medium text-blue-600">
                              {movement.consultorioNombre || 'Sin consultorio'}
                            </p>
                          </div>

                          {/* Fecha */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Fecha</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(movement.createdAt).toLocaleDateString('es-MX')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.createdAt).toLocaleTimeString('es-MX', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>

                          {/* Caducidad */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Caducidad</p>
                            {movement.expiryDate ? (
                              <p className={`text-sm font-medium ${
                                new Date(movement.expiryDate) < new Date() 
                                  ? 'text-red-600' 
                                  : new Date(movement.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                              }`}>
                                {new Date(movement.expiryDate).toLocaleDateString('es-MX')}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400">No especificada</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 