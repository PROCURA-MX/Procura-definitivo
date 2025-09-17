import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Seleccionar hora",
  className = "",
  disabled = false 
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parsear el valor inicial
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours === 0 ? 12 : hours > 12 ? hours - 12 : hours);
      setSelectedMinute(minutes);
      setIsAM(hours < 12);
    }
  }, [value]);

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

  const formatTime = (hour: number, minute: number, am: boolean) => {
    const displayHour = hour === 0 ? 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    const period = am ? 'a.m.' : 'p.m.';
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleTimeChange = (hour: number, minute: number, am: boolean) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setIsAM(am);
    
    // Convertir a formato 24 horas para el valor
    let hour24 = hour;
    if (hour === 12) {
      hour24 = am ? 0 : 12;
    } else if (!am) {
      hour24 = hour + 12;
    }
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={value ? formatTime(selectedHour, selectedMinute, isAM) : ''}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="cursor-pointer pr-10"
        />
        <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto"
        >
          {/* Header con hora actual */}
          <div className="text-center mb-3">
            <div className="text-xl font-bold text-white">
              {formatTime(selectedHour, selectedMinute, isAM)}
            </div>
          </div>

          {/* Selector de hora */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Hora */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-300 mb-1">Hora</div>
              <div className="flex flex-col items-center space-y-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHour = selectedHour === 12 ? 1 : selectedHour + 1;
                    handleTimeChange(newHour, selectedMinute, isAM);
                  }}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronUp className="h-3 w-3" />
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
                  className="text-base font-semibold text-white min-w-[1.5rem] text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHour = selectedHour === 1 ? 12 : selectedHour - 1;
                    handleTimeChange(newHour, selectedMinute, isAM);
                  }}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Minutos */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-300 mb-1">Minutos</div>
              <div className="flex flex-col items-center space-y-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMinute = selectedMinute === 59 ? 0 : selectedMinute + 1;
                    handleTimeChange(selectedHour, newMinute, isAM);
                  }}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
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
                  className="text-base font-semibold text-white min-w-[1.5rem] text-center bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newMinute = selectedMinute === 0 ? 59 : selectedMinute - 1;
                    handleTimeChange(selectedHour, newMinute, isAM);
                  }}
                  className="h-6 w-6 p-0 text-white hover:text-gray-300 hover:bg-gray-700"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* AM/PM */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-300 mb-1">Período</div>
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
          </div>

          {/* Selector rápido de horas */}
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-300 mb-1">Horas comunes</div>
            <div className="grid grid-cols-4 gap-1">
              {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                <Button
                  key={hour}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTimeChange(hour, selectedMinute, isAM)}
                  className={`text-xs h-6 px-1 text-white border-gray-600 hover:bg-gray-700 ${selectedHour === hour ? 'bg-blue-600 border-blue-500' : ''}`}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </div>

          {/* Selector rápido de minutos */}
          <div>
            <div className="text-sm font-medium text-gray-300 mb-1">Minutos comunes</div>
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
      )}
    </div>
  );
} 