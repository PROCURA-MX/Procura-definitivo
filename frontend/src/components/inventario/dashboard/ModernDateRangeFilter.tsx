'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DialogDatePicker } from '@/components/ui/dialog-date-picker'
import { Label } from '@/components/ui/label'
import { Calendar, Search, RotateCcw, Clock, CalendarDays } from 'lucide-react'
import { usePersistentDateFilter } from '@/hooks/usePersistentDateFilter'

interface ModernDateRangeFilterProps {
  sedeId?: string
  basePath?: string
}

// Función para obtener fechas de períodos comunes
const getDateRange = (period: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Función helper para formatear fecha en formato YYYY-MM-DD sin conversión UTC
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  switch (period) {
    case 'today':
      return {
        from: formatDateLocal(today),
        to: formatDateLocal(today)
      }
    case 'thisWeek':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        from: formatDateLocal(startOfWeek),
        to: formatDateLocal(endOfWeek)
      }
    case 'lastWeek':
      const lastWeekStart = new Date(today)
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
      return {
        from: formatDateLocal(lastWeekStart),
        to: formatDateLocal(lastWeekEnd)
      }
    case 'lastTwoWeeks':
      const twoWeeksAgo = new Date(today)
      twoWeeksAgo.setDate(today.getDate() - 14)
      return {
        from: formatDateLocal(twoWeeksAgo),
        to: formatDateLocal(today)
      }
    case 'thisMonth':
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        from: formatDateLocal(firstDay),
        to: formatDateLocal(lastDay)
      }
    case 'lastMonth':
      const lastMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthLast = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        from: formatDateLocal(lastMonthFirst),
        to: formatDateLocal(lastMonthLast)
      }
    case 'lastTwoMonths':
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      return {
        from: formatDateLocal(twoMonthsAgo),
        to: formatDateLocal(today)
      }
    case 'lastThreeMonths':
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      return {
        from: formatDateLocal(threeMonthsAgo),
        to: formatDateLocal(today)
      }
    case 'lastSixMonths':
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      return {
        from: formatDateLocal(sixMonthsAgo),
        to: formatDateLocal(today)
      }
    case 'lastYear':
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      return {
        from: formatDateLocal(lastYear),
        to: formatDateLocal(today)
      }
    default:
      return { from: '', to: '' }
  }
}

export function ModernDateRangeFilter({ 
  sedeId,
  basePath = '/dashboard'
}: ModernDateRangeFilterProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { from, to, updateDates, clearDates } = usePersistentDateFilter(sedeId)
  const [fromDate, setFromDate] = useState<Date | null>(from ? new Date(from) : null)
  const [toDate, setToDate] = useState<Date | null>(to ? new Date(to) : null)
  const [isCustomRange, setIsCustomRange] = useState(false)

  // Función helper para convertir Date a string YYYY-MM-DD
  const formatDateToString = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Función helper para convertir string YYYY-MM-DD a Date
  const parseStringToDate = (dateString: string): Date | null => {
    if (!dateString) return null
    return new Date(dateString)
  }

  // Actualizar fechas locales cuando cambien las fechas persistentes
  useEffect(() => {
    setFromDate(parseStringToDate(from))
    setToDate(parseStringToDate(to))
  }, [from, to])

  const handleQuickSelect = (period: string) => {
    const range = getDateRange(period)
    const fromDateObj = parseStringToDate(range.from)
    const toDateObj = parseStringToDate(range.to)
    
    setFromDate(fromDateObj)
    setToDate(toDateObj)
    setIsCustomRange(false)
    
    // Actualizar fechas persistentes
    updateDates(range.from, range.to)
  }

  const handleCustomSearch = () => {
    const fromString = formatDateToString(fromDate)
    const toString = formatDateToString(toDate)
    updateDates(fromString, toString)
  }

  const handleReset = () => {
    setFromDate(null)
    setToDate(null)
    setIsCustomRange(false)
    clearDates()
  }

  const quickOptions = [
    { key: 'today', label: 'Hoy', icon: Calendar },
    { key: 'thisWeek', label: 'Esta semana', icon: CalendarDays },
    { key: 'lastWeek', label: 'Última semana', icon: Clock },
    { key: 'lastTwoWeeks', label: 'Últimas 2 semanas', icon: Clock },
    { key: 'thisMonth', label: 'Mes actual', icon: Calendar },
    { key: 'lastMonth', label: 'Mes pasado', icon: Calendar },
    { key: 'lastTwoMonths', label: 'Últimos 2 meses', icon: Calendar },
    { key: 'lastThreeMonths', label: 'Últimos 3 meses', icon: Calendar },
    { key: 'lastSixMonths', label: 'Últimos 6 meses', icon: Calendar },
    { key: 'lastYear', label: 'Último año', icon: Calendar },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Filtrar por Fecha</h3>
          <p className="text-sm text-gray-600">Selecciona un período o define un rango personalizado</p>
        </div>
      </div>

      {/* Opciones rápidas */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Períodos rápidos
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {quickOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.key}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(option.key)}
                className="h-10 px-3 text-xs font-medium border-gray-200 bg-gray-800 hover:border-blue-300 hover:bg-blue-600 text-white hover:text-white transition-all duration-200"
              >
                <Icon className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Separador */}
      <div className="flex items-center mb-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="px-4 text-sm text-gray-500 font-medium">O rango personalizado</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Rango personalizado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <DialogDatePicker
          selected={fromDate}
          onChange={(date: Date | null) => {
            setFromDate(date)
            setIsCustomRange(true)
          }}
          placeholder="Seleccionar fecha inicial"
          className="w-full"
          enableQuickNavigation={true}
          yearRange="both"
        />
        
        <DialogDatePicker
          selected={toDate}
          onChange={(date: Date | null) => {
            setToDate(date)
            setIsCustomRange(true)
          }}
          placeholder="Seleccionar fecha final"
          className="w-full"
          enableQuickNavigation={true}
          yearRange="both"
        />
        
        <div className="flex gap-3">
          <Button 
            onClick={handleCustomSearch}
            disabled={!fromDate || !toDate}
            className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4" />
            Aplicar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="h-11 px-4 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Indicador de rango activo */}
      {fromDate && toDate && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            Rango activo: <span className="font-semibold">{formatDateToString(fromDate)}</span> hasta <span className="font-semibold">{formatDateToString(toDate)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
