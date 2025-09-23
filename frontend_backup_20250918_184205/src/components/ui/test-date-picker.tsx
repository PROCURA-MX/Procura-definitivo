'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface TestDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TestDatePicker({
  selected,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = ""
}: TestDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return ""
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }, [])

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    console.log('🔍 [TestDatePicker] handleInputClick llamado')
    console.log('🔍 [TestDatePicker] Event target:', e.target)
    console.log('🔍 [TestDatePicker] Event currentTarget:', e.currentTarget)
    console.log('🔍 [TestDatePicker] disabled:', disabled)
    console.log('🔍 [TestDatePicker] isOpen actual:', isOpen)
    
    e.preventDefault()
    e.stopPropagation()
    
    if (!disabled) {
      const newIsOpen = !isOpen
      console.log('🔍 [TestDatePicker] Cambiando isOpen de', isOpen, 'a', newIsOpen)
      setIsOpen(newIsOpen)
    }
  }, [disabled, isOpen])

  const handleDateChange = useCallback((date: Date) => {
    console.log('🔍 [TestDatePicker] handleDateChange llamado')
    console.log('🔍 [TestDatePicker] Fecha seleccionada:', date)
    
    onChange(date)
    console.log('🔍 [TestDatePicker] onChange ejecutado')
    
    setIsOpen(false)
    console.log('🔍 [TestDatePicker] Calendario cerrado por selección de fecha')
  }, [onChange])

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

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('🔍 [TestDatePicker] handleClickOutside llamado')
      console.log('🔍 [TestDatePicker] Event target:', event.target)
      console.log('🔍 [TestDatePicker] containerRef.current:', containerRef.current)
      console.log('🔍 [TestDatePicker] calendarRef.current:', calendarRef.current)
      
      const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target as Node)
      const isClickInsideCalendar = calendarRef.current && calendarRef.current.contains(event.target as Node)
      
      console.log('🔍 [TestDatePicker] isClickInsideContainer:', isClickInsideContainer)
      console.log('🔍 [TestDatePicker] isClickInsideCalendar:', isClickInsideCalendar)
      
      if (!isClickInsideContainer && !isClickInsideCalendar) {
        console.log('🔍 [TestDatePicker] Cerrando calendario por click fuera')
        setIsOpen(false)
      } else {
        console.log('🔍 [TestDatePicker] Click dentro del calendario, NO cerrando')
      }
    }

    if (isOpen) {
      console.log('🔍 [TestDatePicker] Agregando event listener para click fuera CON DELAY')
      // SOLUCIÓN: Retrasar la activación del listener para evitar cierre inmediato
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100) // 100ms de delay

      return () => {
        console.log('🔍 [TestDatePicker] Removiendo event listener y timeout')
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const days = generateDays(currentMonth.getFullYear(), currentMonth.getMonth())
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  console.log('🔍 [TestDatePicker] Renderizando componente, isOpen:', isOpen)
  
  return (
    <>
      <div 
        ref={containerRef} 
        className={`relative ${className}`}
        onClick={(e) => {
          console.log('🔍 [TestDatePicker] Click en contenedor, stopPropagation')
          e.stopPropagation()
        }}
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(null)
                }}
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
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999
          }}
        >
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
            <button
              type="button"
              onClick={() => handleMonthChange('prev')}
              className="p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long'
              })}
            </h2>

            <button
              type="button"
              onClick={() => handleMonthChange('next')}
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
                    console.log('🔍 [TestDatePicker] Click en día:', day.getDate())
                    console.log('🔍 [TestDatePicker] isCurrentMonth:', isCurrentMonth)
                    e.stopPropagation()
                    
                    if (isCurrentMonth) {
                      console.log('🔍 [TestDatePicker] Llamando handleDateChange')
                      handleDateChange(day)
                    } else {
                      console.log('🔍 [TestDatePicker] Día no seleccionable')
                    }
                  }}
                  disabled={!isCurrentMonth}
                  className={`
                    w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors
                    ${isCurrentMonth 
                      ? 'text-gray-900 hover:bg-blue-100' 
                      : 'text-gray-400'
                    }
                    ${isToday ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                    ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
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
