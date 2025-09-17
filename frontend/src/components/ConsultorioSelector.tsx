import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Building2, ChevronDown } from 'lucide-react';
import { useConsultorioContext } from '../contexts/ConsultorioContext';

interface ConsultorioSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function ConsultorioSelector({ className = '', showLabel = true }: ConsultorioSelectorProps) {
  const {
    consultorios,
    selectedConsultorioId,
    setSelectedConsultorioId,
    shouldShowSelector,
    loading,
    error
  } = useConsultorioContext();

  // Obtener el consultorio seleccionado
  const selectedConsultorio = selectedConsultorioId === 'todos' 
    ? { id: 'todos', nombre: 'Todos los consultorios', direccion: '' }
    : consultorios.find(c => c.id === selectedConsultorioId) || null;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera - SIEMPRE ANTES DE LOS RETURNS
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mouseup', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, [isOpen]);

  // Si no debe mostrar el selector o está cargando, no mostrar nada
  if (!shouldShowSelector || loading) {
    return null;
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  const options = [
    { id: 'todos', nombre: 'Todos los consultorios' },
    ...consultorios
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          Consultorio:
        </span>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 min-w-[200px] justify-between bg-white border-gray-300 hover:bg-gray-50 text-gray-900"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Building2 className="h-4 w-4 text-gray-600" />
          <span className="truncate text-gray-900">
            {selectedConsultorio?.nombre || 'Seleccionar consultorio'}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]">
            {options.map((option) => (
              <div
                key={option.id}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedConsultorioId === option.id 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-700'
                }`}
                onClick={() => {
                  console.log('🔍 ConsultorioSelector - Seleccionando:', option.id, option.nombre);
                  setSelectedConsultorioId(option.id);
                  setIsOpen(false);
                }}
              >
                {option.nombre}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
