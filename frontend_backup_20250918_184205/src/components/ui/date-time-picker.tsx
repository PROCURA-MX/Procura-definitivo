import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Calendar, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Seleccionar fecha y hora",
  className = "",
  disabled = false 
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [selectedHour, setSelectedHour] = useState(value ? value.getHours() : 12);
  const [selectedMinute, setSelectedMinute] = useState(value ? value.getMinutes() : 0);
  const [isAM, setIsAM] = useState(value ? value.getHours() < 12 : true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (hour: number, minute: number, am: boolean) => {
    const displayHour = hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    const period = am ? 'a.m.' : 'p.m.';
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
    updateValue(newDate, selectedHour, selectedMinute, isAM);
  };

  const handleTimeChange = (hour: number, minute: number, am: boolean) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsAM(am);
    updateValue(selectedDate, hour, minute, am);
  };

  const updateValue = (date: Date, hour: number, minute: number, am: boolean) => {
    const newDate = new Date(date);
    let hour24 = hour;
    if (hour === 12) {
      hour24 = am ? 0 : 12;
    } else if (!am) {
      hour24 = hour + 12;
    }
    newDate.setHours(hour24, minute, 0, 0);
    onChange(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Días del mes anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors
            ${isSelectedDay 
              ? 'bg-blue-600 text-white' 
              : isCurrentDay 
                ? 'bg-blue-100 text-blue-600' 
                : 'hover:bg-gray-100 text-white'
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value ? `${formatDate(value)} ${formatTime(selectedHour, selectedMinute, isAM)}` : ''}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="cursor-pointer pr-10"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-lg font-bold text-white">
              {formatDate(selectedDate)} {formatTime(selectedHour, selectedMinute, isAM)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Calendario */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <div className="text-sm font-medium text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                  <div key={index} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-between mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCurrentDate(new Date());
                  }}
                  className="text-xs h-6 text-white border-gray-600 hover:bg-gray-700"
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(null)}
                  className="text-xs h-6 text-white border-gray-600 hover:bg-gray-700"
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* Selector de hora */}
            <div>
              <div className="text-sm font-medium text-gray-300 mb-2">Hora</div>
              
              {/* Hora */}
              <div className="text-center mb-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Hora</div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newHour = selectedHour === 1 ? 12 : selectedHour - 1;
                      handleTimeChange(newHour, selectedMinute, isAM);
                    }}
                    className="h-8 w-8 p-0 text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedHour}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 12) {
                        handleTimeChange(value, selectedMinute, isAM);
                      }
                    }}
                    className="text-lg font-semibold text-white min-w-[2rem] text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newHour = selectedHour === 12 ? 1 : selectedHour + 1;
                      handleTimeChange(newHour, selectedMinute, isAM);
                    }}
                    className="h-8 w-8 p-0 text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Minutos */}
              <div className="text-center mb-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Minutos</div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute === 0 ? 59 : selectedMinute - 1;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="h-8 w-8 p-0 text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-semibold text-white min-w-[2rem] text-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedMinute.toString().padStart(2, '0')}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 0 && value <= 59) {
                          handleTimeChange(selectedHour, value, isAM);
                        }
                      }}
                      className="text-lg font-semibold text-white min-w-[2rem] text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute === 59 ? 0 : selectedMinute + 1;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="h-8 w-8 p-0 text-white border-gray-600 hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* AM/PM */}
              <div className="text-center">
                <div className="text-xs font-medium text-gray-300 mb-1">Período</div>
                <div className="flex flex-col space-y-0.5">
                  <Button
                    variant={isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, true)}
                    className={`h-6 text-xs ${isAM ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white border-gray-600 hover:bg-gray-700'}`}
                  >
                    a.m.
                  </Button>
                  <Button
                    variant={!isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeChange(selectedHour, selectedMinute, false)}
                    className={`h-6 text-xs ${!isAM ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-white border-gray-600 hover:bg-gray-700'}`}
                  >
                    p.m.
                  </Button>
                </div>
              </div>

              {/* Horas comunes */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Horas comunes</div>
                <div className="grid grid-cols-4 gap-1">
                  {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0].map((hour) => {
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    const displayPeriod = hour >= 12 ? 'p.m.' : 'a.m.';
                    return (
                      <Button
                        key={hour}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimeChange(displayHour, selectedMinute, hour < 12)}
                        className={`text-xs h-6 px-1 text-white border-gray-600 hover:bg-gray-700 ${selectedHour === displayHour && isAM === (hour < 12) ? 'bg-blue-600 border-blue-500' : ''}`}
                      >
                        {displayHour}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Incrementos rápidos de minutos */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Incrementos rápidos</div>
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute >= 55 ? 0 : selectedMinute + 5;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="text-xs h-6 px-2 text-white border-gray-600 hover:bg-gray-700"
                  >
                    +5 min
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute >= 45 ? 0 : selectedMinute + 15;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="text-xs h-6 px-2 text-white border-gray-600 hover:bg-gray-700"
                  >
                    +15 min
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute <= 5 ? 55 : selectedMinute - 5;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="text-xs h-6 px-2 text-white border-gray-600 hover:bg-gray-700"
                  >
                    -5 min
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMinute = selectedMinute <= 15 ? 45 : selectedMinute - 15;
                      handleTimeChange(selectedHour, newMinute, isAM);
                    }}
                    className="text-xs h-6 px-2 text-white border-gray-600 hover:bg-gray-700"
                  >
                    -15 min
                  </Button>
                </div>
              </div>

              {/* Minutos comunes */}
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Minutos comunes</div>
                <div className="grid grid-cols-6 gap-1">
                  {[0, 15, 30, 45, 5, 10, 20, 25, 35, 40, 50, 55].map((minute) => (
                    <Button
                      key={minute}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimeChange(selectedHour, minute, isAM)}
                      className={`text-xs h-6 px-1 text-white border-gray-600 hover:bg-gray-700 ${selectedMinute === minute ? 'bg-blue-600 border-blue-500' : ''}`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 