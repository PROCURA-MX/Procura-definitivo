import { useState, useCallback, useRef } from 'react'

interface MovementDetail {
  id: string
  name: string
  quantity: number
  totalValue: number
  unitCost?: number
  batchNumber?: string
  expiryDate?: string
  createdAt: string
  userId?: string
  sedeId?: string
  consultorioId?: string
  consultorioNombre?: string
}

interface CategoryDetailModalState {
  open: boolean
  category: string | null
  movements: MovementDetail[]
  type: 'ENTRY' | 'EXIT'
  totalQuantity: number
  totalValue: number
  loading: boolean
}

// Caché para almacenar datos ya cargados
const dataCache = new Map<string, MovementDetail[]>()

export function useCategoryDetailModal() {
  const [modalState, setModalState] = useState<CategoryDetailModalState>({
    open: false,
    category: null,
    movements: [],
    type: 'ENTRY',
    totalQuantity: 0,
    totalValue: 0,
    loading: false
  })

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const openModal = useCallback((
    category: string, 
    movements: MovementDetail[], 
    type: 'ENTRY' | 'EXIT',
    totalQuantity: number,
    totalValue: number
  ) => {
    // Generar clave única para el caché
    const cacheKey = `${type}-${category}-${totalQuantity}-${totalValue}`
    
    // Verificar si ya tenemos los datos en caché
    const cachedData = dataCache.get(cacheKey)
    
    if (cachedData) {
      // Si tenemos datos en caché, mostrarlos inmediatamente
      setModalState({
        open: true,
        category,
        movements: cachedData,
        type,
        totalQuantity,
        totalValue,
        loading: false
      })
    } else {
      // Si no tenemos datos en caché, mostrar loading y cargar
      setModalState({
        open: true,
        category,
        movements: [],
        type,
        totalQuantity,
        totalValue,
        loading: true
      })
      
      // Simular un pequeño delay para mostrar el loading state
      loadingTimeoutRef.current = setTimeout(() => {
        setModalState(prev => ({
          ...prev,
          movements,
          loading: false
        }))
        
        // Guardar en caché para futuras consultas
        dataCache.set(cacheKey, movements)
      }, 100)
    }
  }, [])

  const closeModal = useCallback(() => {
    // Limpiar timeout si existe
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }
    
    setModalState(prev => ({ ...prev, open: false, loading: false }))
  }, [])

  const clearCache = useCallback(() => {
    dataCache.clear()
  }, [])

  return {
    ...modalState,
    openModal,
    closeModal,
    clearCache
  }
}
