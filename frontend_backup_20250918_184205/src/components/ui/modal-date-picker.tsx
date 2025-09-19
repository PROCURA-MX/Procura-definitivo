'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface ModalDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ModalDatePicker({
  selected,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = ""
}: ModalDatePickerProps) {
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
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }, [disabled, isOpen])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  const handleDateChange = useCallback((date: Date) => {
    onChange(date)
    setIsOpen(false)
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

  // SOLUCIÓN ESPECÍFICA PARA MODALES: Usar mouseup en lugar de mousedown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Usar mouseup para evitar conflictos con el modal
      document.addEventListener('mouseup', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mouseup', handleClickOutside)
    }
  }, [isOpen])

  const days = generateDays(currentMonth.getFullYear(), currentMonth.getMonth())
  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  return (
    <>
      <div 
        ref={containerRef} 
        className={`relative ${className}`}
        onClick={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
        >
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
            </div>

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
                    e.stopPropagation()
                    if (isCurrentMonth) {
                      handleDateChange(day)
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
                    ${!isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
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
