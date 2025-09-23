'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Label } from './label'
import { es } from 'date-fns/locale/es'
import 'react-datepicker/dist/react-datepicker.css'

// Registrar el locale español
registerLocale('es', es)

interface ModernDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  enableQuickNavigation?: boolean // Nueva prop para navegación rápida
  yearRange?: 'future' | 'past' | 'both' // Para fechas de caducidad vs fechas de nacimiento
}

export function ModernDatePicker({
  selected,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
  disabled = false,
  className = "",
  minDate,
  maxDate,
  enableQuickNavigation = false,
  yearRange = 'future'
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Memoizar la función de formateo para evitar recreaciones
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return ""
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }, [])

  // Función para manejar el click en el input
  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
      setIsPositioned(false) // Resetear el estado de posicionamiento
    }
  }, [disabled, isOpen])

  // Función para limpiar la fecha
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  // Función para manejar el cambio de fecha
  const handleDateChange = useCallback((date: Date | null) => {
    onChange(date)
    setIsOpen(false)
    setIsPositioned(false)
  }, [onChange])

  // Función para navegar meses
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

  // Función optimizada para calcular posición del calendario
  const updateCalendarPosition = useCallback(() => {
    if (!containerRef.current || !calendarRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Estimación del tamaño del calendario (aproximadamente 320x280)
    const calendarWidth = 320
    const calendarHeight = 280

    // Calcular posición inicial
    let top = containerRect.bottom + 5
    let left = containerRect.left

    // Verificar si el calendario se sale por abajo
    if (top + calendarHeight > viewportHeight) {
      top = containerRect.top - calendarHeight - 5
    }

    // Verificar si el calendario se sale por la derecha
    if (left + calendarWidth > viewportWidth) {
      left = viewportWidth - calendarWidth - 10
    }

    // Asegurar que no se salga por la izquierda
    if (left < 10) {
      left = 10
    }

    // Asegurar que no se salga por arriba
    if (top < 10) {
      top = 10
    }

    calendarRef.current.style.top = `${top}px`
    calendarRef.current.style.left = `${left}px`
    setIsPositioned(true)
  }, [])

  // Memoizar el header del calendario para evitar recreaciones
  const calendarHeader = useMemo(() => (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
      <button
        type="button"
        onClick={() => handleMonthChange('prev')}
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
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(parseInt(e.target.value))
                setCurrentMonth(newMonth)
              }}
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
                const newMonth = new Date(currentMonth)
                newMonth.setFullYear(parseInt(e.target.value))
                setCurrentMonth(newMonth)
              }}
              className="px-2 py-1 text-sm bg-gray-600 text-white rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              {yearRange === 'past' ? (
                // Para fechas de nacimiento: desde 1924 hasta año actual
                Array.from({ length: 101 }, (_, i) => {
                  const year = new Date().getFullYear() - i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })
              ) : yearRange === 'both' ? (
                // Para fechas generales: desde 1924 hasta 15 años en el futuro
                Array.from({ length: 116 }, (_, i) => {
                  const year = new Date().getFullYear() - 100 + i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })
              ) : (
                // Para fechas de caducidad: desde año actual hasta 15 años en el futuro
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
        onClick={() => handleMonthChange('next')}
        className="p-2 rounded-lg hover:bg-gray-600 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  ), [currentMonth, handleMonthChange, enableQuickNavigation, yearRange])

  // Actualizar posición cuando se abre el calendario
  useEffect(() => {
    if (isOpen) {
      // Reducir el delay para una apertura más rápida
      const timer = setTimeout(() => {
        updateCalendarPosition()
      }, 10) // Reducido de 50ms a 10ms
      
      const handleScroll = () => {
        if (isOpen) {
          updateCalendarPosition()
        }
      }

      const handleResize = () => {
        if (isOpen) {
          updateCalendarPosition()
        }
      }

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isOpen, updateCalendarPosition])

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsPositioned(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mouseup', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mouseup', handleClickOutside)
    }
  }, [isOpen])

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        {label && (
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            {label}
          </Label>
        )}
        
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
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={calendarRef}
          className={`fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-opacity duration-150 ${
            isPositioned ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            position: 'fixed',
            top: '-9999px', // Posición inicial fuera de la pantalla
            left: '-9999px',
            zIndex: 9999
          }}
        >
          {calendarHeader}
          
          <DatePicker
            selected={selected}
            onChange={handleDateChange}
            inline
            locale="es"
            minDate={minDate}
            maxDate={maxDate}
            openToDate={currentMonth}
            calendarClassName="modern-datepicker-portal"
            dayClassName={(date) => {
              const today = new Date()
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selected && date.toDateString() === selected.toDateString()
              
              if (isSelected) return 'selected-day'
              if (isToday) return 'today-day'
              return ''
            }}
            renderCustomHeader={() => <div />} // Usamos nuestro header personalizado

          />
          
          {/* CSS específico solo para corregir la alineación horizontal */}
          <style>{`
            /* Corregir la alineación horizontal de los días de la semana usando las clases correctas */
            .modern-datepicker-portal .react-datepicker__day-name {
              color: #000000 !important;
              font-weight: 600 !important;
              text-align: center !important;
              width: 40px !important;
              height: 40px !important;
              line-height: 40px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              display: inline-block !important;
              vertical-align: top !important;
            }
            
            /* Asegurar que los días del mes tengan el mismo ancho */
            .modern-datepicker-portal .react-datepicker__day {
              width: 40px !important;
              height: 40px !important;
              line-height: 40px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              text-align: center !important;
              display: inline-block !important;
              vertical-align: top !important;
            }
            
            /* Centrar el contenedor de días de la semana para alinearlo con las columnas */
            .modern-datepicker-portal .react-datepicker__day-names {
              display: flex !important;
              justify-content: center !important;
              align-items: center !important;
              width: 100% !important;
              padding: 0 8px !important;
              box-sizing: border-box !important;
              white-space: nowrap !important;
              margin-bottom: 0 !important;
            }
            
            /* Centrar el contenedor de días del mes para que coincida */
            .modern-datepicker-portal .react-datepicker__month {
              text-align: center !important;
              width: 100% !important;
              padding: 0 8px !important;
              box-sizing: border-box !important;
              margin: 0 !important;
            }
            
            /* Asegurar que las semanas estén centradas */
            .modern-datepicker-portal .react-datepicker__week {
              text-align: center !important;
              white-space: nowrap !important;
            }
            
            /* Ocultar elementos innecesarios */
            .modern-datepicker-portal .react-datepicker__header {
              display: none !important;
            }
            
            .modern-datepicker-portal .react-datepicker__navigation {
              display: none !important;
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  )
}
