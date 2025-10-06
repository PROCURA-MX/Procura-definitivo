'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DialogDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  enableQuickNavigation?: boolean
  yearRange?: 'future' | 'past' | 'both'
  onOpenChange?: (isOpen: boolean) => void
}

export function DialogDatePicker({
  selected,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = "",
  enableQuickNavigation = false,
  yearRange = 'past',
  onOpenChange
}: DialogDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const isOpeningRef = useRef(false)

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return ""
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }, [])

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled) return
    
    // Prevenir múltiples aperturas
    if (isOpeningRef.current) return
    
    isOpeningRef.current = true
    const newIsOpen = !isOpen
    
    // Delay para evitar conflictos con otros eventos
    setTimeout(() => {
      setIsOpen(newIsOpen)
      onOpenChange?.(newIsOpen)
      isOpeningRef.current = false
    }, 10)
  }, [disabled, isOpen, onOpenChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  const handleDateChange = useCallback((date: Date) => {
    // Delay para asegurar que el evento se procese correctamente
    setTimeout(() => {
      onChange(date)
      setIsOpen(false)
      onOpenChange?.(false)
    }, 50)
  }, [onChange, onOpenChange])

  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }, [])

  const generateDays = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return days
  }, [])

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return 'bottom'

    const containerRect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const calendarHeight = enableQuickNavigation ? 420 : 380
    const spaceBelow = viewportHeight - containerRect.bottom
    const spaceAbove = containerRect.top

    if (spaceAbove > spaceBelow && spaceAbove > calendarHeight) {
      return 'top'
    }
    
    return 'bottom'
  }, [enableQuickNavigation])

  // SOLUCIÓN ROBUSTA: Manejo mejorado de eventos
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      // Verificar que el clic no sea en el contenedor o calendario
      const target = event.target as Node
      
      if (containerRef.current?.contains(target) || 
          calendarRef.current?.contains(target)) {
        return
      }

      // Verificar que no sea un clic en un elemento del calendario
      const calendarElement = calendarRef.current
      if (calendarElement && calendarElement.contains(target)) {
        return
      }

      // Solo cerrar si realmente es un clic fuera
      setIsOpen(false)
      onOpenChange?.(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        onOpenChange?.(false)
      }
    }

    // Delay para evitar conflictos con el evento de apertura
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
      document.addEventListener('keydown', handleEscape, true)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
      document.removeEventListener('keydown', handleEscape, true)
    }
  }, [isOpen, onOpenChange])

  // Calcular posición cuando se abre
  useEffect(() => {
    if (isOpen) {
      setPosition(calculatePosition())
    }
  }, [isOpen, calculatePosition])

  const days = generateDays(currentMonth.getFullYear(), currentMonth.getMonth())
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
    >
      <div className="relative">
        <div
          onClick={handleInputClick}
          className="h-11 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 transition-colors cursor-pointer pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
            {selected ? formatDate(selected) : placeholder}
          </span>
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selected && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors mr-1"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-[99999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            top: position === 'bottom' ? '100%' : 'auto',
            bottom: position === 'top' ? '100%' : 'auto',
            left: '0',
            minWidth: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            marginTop: position === 'bottom' ? '4px' : '0',
            marginBottom: position === 'top' ? '4px' : '0'
          }}
          // PREVENIR PROPAGACIÓN DE EVENTOS
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMonthChange('prev')
              }}
              className="p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long'
                })}
              </h2>
              
              {enableQuickNavigation && (
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={currentMonth.getMonth()}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newMonth = new Date(currentMonth)
                      newMonth.setMonth(parseInt(e.target.value))
                      setCurrentMonth(newMonth)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value={0}>Enero</option>
                    <option value={1}>Febrero</option>
                    <option value={2}>Marzo</option>
                    <option value={3}>Abril</option>
                    <option value={4}>Mayo</option>
                    <option value={5}>Junio</option>
                    <option value={6}>Julio</option>
                    <option value={7}>Agosto</option>
                    <option value={8}>Septiembre</option>
                    <option value={9}>Octubre</option>
                    <option value={10}>Noviembre</option>
                    <option value={11}>Diciembre</option>
                  </select>
                  
                  <select
                    value={currentMonth.getFullYear()}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newMonth = new Date(currentMonth)
                      newMonth.setFullYear(parseInt(e.target.value))
                      setCurrentMonth(newMonth)
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    {yearRange === 'past' ? (
                      Array.from({ length: 101 }, (_, i) => {
                        const year = new Date().getFullYear() - i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })
                    ) : yearRange === 'both' ? (
                      Array.from({ length: 116 }, (_, i) => {
                        const year = new Date().getFullYear() - 100 + i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })
                    ) : (
                      Array.from({ length: 15 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })
                    )}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMonthChange('next')
              }}
              className="p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0 p-4 pt-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-900"
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = selected && day.toDateString() === selected.toDateString()

              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isCurrentMonth) {
                      handleDateChange(day)
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={!isCurrentMonth}
                  className={`
                    w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors
                    ${isCurrentMonth
                      ? 'text-gray-900 hover:bg-blue-100'
                      : 'text-gray-400'
                    }
                    ${isToday ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${!isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
