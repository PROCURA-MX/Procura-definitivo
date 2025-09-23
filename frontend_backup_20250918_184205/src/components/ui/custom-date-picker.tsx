'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Label } from './label'

interface CustomDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  enableQuickNavigation?: boolean
  yearRange?: 'future' | 'past' | 'both'
}

export function CustomDatePicker({
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
}: CustomDatePickerProps) {
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
      setIsPositioned(false)
    }
  }, [disabled, isOpen])

  // Función para limpiar la fecha
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  // Función para manejar el cambio de fecha
  const handleDateChange = useCallback((date: Date) => {
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

  // Función para generar los días del mes
  const generateDays = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    // Generar 42 días (6 semanas x 7 días) para cubrir todo el mes
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [])

  // Función optimizada para calcular posición del calendario
  const updateCalendarPosition = useCallback(() => {
    if (!containerRef.current || !calendarRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Estimación del tamaño del calendario
    const calendarWidth = 320
    const calendarHeight = 320

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

  // Memoizar el header del calendario
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
                const newMonth = new Date(currentMonth)
                newMonth.setFullYear(parseInt(e.target.value))
                setCurrentMonth(newMonth)
              }}
              onClick={(e) => e.stopPropagation()}
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
      const timer = setTimeout(() => {
        updateCalendarPosition()
      }, 10)
      
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
      const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target as Node)
      const isClickInsideCalendar = calendarRef.current && calendarRef.current.contains(event.target as Node)
      
      if (!isClickInsideContainer && !isClickInsideCalendar) {
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

  // Generar días del mes actual
  const days = useMemo(() => {
    return generateDays(currentMonth.getFullYear(), currentMonth.getMonth())
  }, [currentMonth, generateDays])

  // Días de la semana
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  return (
    <>
      <div 
        ref={containerRef} 
        className={`relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
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
            top: '-9999px',
            left: '-9999px',
            zIndex: 9999
          }}
        >
          {calendarHeader}
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-0 p-4 pt-2">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-900"
              >
                {day}
              </div>
            ))}
            
            {/* Días del mes */}
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = selected && day.toDateString() === selected.toDateString()
              const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate)
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    
                    if (!isDisabled && isCurrentMonth) {
                      handleDateChange(day)
                    }
                  }}
                  disabled={isDisabled || !isCurrentMonth}
                  className={`
                    w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors
                    ${isCurrentMonth 
                      ? 'text-gray-900 hover:bg-blue-100' 
                      : 'text-gray-400'
                    }
                    ${isToday ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
