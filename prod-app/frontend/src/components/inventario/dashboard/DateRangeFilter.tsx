'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Search, RotateCcw } from 'lucide-react'

interface DateRangeFilterProps {
  initialFrom?: string
  initialTo?: string
  sedeId?: string
  basePath?: string
}

export function DateRangeFilter({ 
  initialFrom, 
  initialTo,
  sedeId,
  basePath = '/dashboard'
}: DateRangeFilterProps) {
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState(initialFrom || '')
  const [toDate, setToDate] = useState(initialTo || '')

  const handleSearch = () => {
    const urlParams = new URLSearchParams()
    if (sedeId) urlParams.append('sedeId', sedeId)
    if (fromDate) urlParams.append('from', fromDate)
    if (toDate) urlParams.append('to', toDate)
    navigate(`${basePath}?${urlParams.toString()}`)
  }

  const handleReset = () => {
    setFromDate('')
    setToDate('')
    const urlParams = new URLSearchParams()
    if (sedeId) urlParams.append('sedeId', sedeId)
    navigate(`${basePath}?${urlParams.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-blue-600" />
        </div>
        <div>
        <h3 className="text-lg font-semibold text-gray-900">Filtrar por Fecha</h3>
          <p className="text-sm text-gray-600">Selecciona un rango de fechas para ver las métricas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="from-date" className="text-sm font-medium text-gray-700">
            Fecha Inicial
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
            placeholder="Seleccionar fecha inicial"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to-date" className="text-sm font-medium text-gray-700">
            Fecha Final
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
            placeholder="Seleccionar fecha final"
          />
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleSearch}
            className="flex items-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="h-11 px-4 border-gray-300 bg-white hover:bg-white text-gray-700 font-medium rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-blue-700" />
          </Button>
        </div>
      </div>
      
      {/* Indicador de filtro activo */}
      {(fromDate || toDate) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Filtro activo:</span>
            <span>
              {fromDate && toDate 
                ? `${new Date(fromDate).toLocaleDateString('es-MX')} - ${new Date(toDate).toLocaleDateString('es-MX')}`
                : fromDate 
                ? `Desde ${new Date(fromDate).toLocaleDateString('es-MX')}`
                : `Hasta ${new Date(toDate).toLocaleDateString('es-MX')}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 