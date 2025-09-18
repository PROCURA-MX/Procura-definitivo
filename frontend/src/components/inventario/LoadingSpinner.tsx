import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Cargando...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin mb-2`} />
      {text && (
        <p className="text-sm text-gray-600 text-center">{text}</p>
      )}
    </div>
  )
}

// Componente de skeleton para simular contenido mientras carga
export function MovementSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Producto */}
        <div className="lg:col-span-2">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
        
        {/* Cantidad */}
        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-5 bg-gray-200 rounded"></div>
        </div>
        
        {/* Valor */}
        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-5 bg-gray-200 rounded"></div>
        </div>
        
        {/* Fecha */}
        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        
        {/* Caducidad */}
        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar múltiples skeletons
export function MovementSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MovementSkeleton key={index} />
      ))}
    </div>
  )
}
