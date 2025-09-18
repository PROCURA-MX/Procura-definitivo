import { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModernDateRangeFilter } from './dashboard/ModernDateRangeFilter'

interface CollapsibleDateFilterProps {
  basePath: string
  sedeId: string
  className?: string
}

export function CollapsibleDateFilter({
  basePath,
  sedeId,
  className = ''
}: CollapsibleDateFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${className}`}>
      {/* Botón para expandir/colapsar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Filtro de Fechas</h3>
            <p className="text-sm text-gray-600">
              Selecciona un rango de fechas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      <div className={`transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 pb-6 border-t border-gray-100">
          <ModernDateRangeFilter 
            basePath={basePath} 
            sedeId={sedeId} 
          />
        </div>
      </div>
    </div>
  )
}
