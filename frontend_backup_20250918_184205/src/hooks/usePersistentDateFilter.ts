import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Función para obtener el rango del mes actual
const getCurrentMonthRange = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    from: formatDateLocal(firstDay),
    to: formatDateLocal(lastDay)
  }
}

// Claves para localStorage
const STORAGE_KEY_FROM = 'inventory_date_filter_from'
const STORAGE_KEY_TO = 'inventory_date_filter_to'

export function usePersistentDateFilter(sedeId?: string) {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Obtener fechas de la URL o localStorage
  const urlParams = new URLSearchParams(location.search)
  const urlFrom = urlParams.get('from')
  const urlTo = urlParams.get('to')
  
  // Estado local para las fechas
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Función para obtener fechas actuales
  const getCurrentDates = () => {
    const currentMonth = getCurrentMonthRange()
    const storedFrom = localStorage.getItem(STORAGE_KEY_FROM)
    const storedTo = localStorage.getItem(STORAGE_KEY_TO)
    
    // Prioridad: URL > localStorage > mes actual
    let finalFrom = urlFrom || storedFrom || currentMonth.from
    let finalTo = urlTo || storedTo || currentMonth.to
    
    // Asegurar que siempre tengamos fechas válidas
    if (!finalFrom || !finalTo) {
      finalFrom = currentMonth.from
      finalTo = currentMonth.to
    }
    
    return { finalFrom, finalTo }
  }
  
  // Efecto principal para sincronizar fechas
  useEffect(() => {
    const { finalFrom, finalTo } = getCurrentDates()
    
    setFrom(finalFrom)
    setTo(finalTo)
    
    // Si hay fechas en la URL, actualizar localStorage
    if (urlFrom && urlTo) {
      localStorage.setItem(STORAGE_KEY_FROM, urlFrom)
      localStorage.setItem(STORAGE_KEY_TO, urlTo)
    }
    // Si no hay fechas en localStorage, guardar las del mes actual
    else if (!localStorage.getItem(STORAGE_KEY_FROM) || !localStorage.getItem(STORAGE_KEY_TO)) {
      localStorage.setItem(STORAGE_KEY_FROM, finalFrom)
      localStorage.setItem(STORAGE_KEY_TO, finalTo)
    }
    
    // Si no hay fechas en la URL pero hay en localStorage, actualizar URL
    const storedFrom = localStorage.getItem(STORAGE_KEY_FROM)
    const storedTo = localStorage.getItem(STORAGE_KEY_TO)
    if (storedFrom && storedTo && !urlFrom && !urlTo) {
      const newParams = new URLSearchParams(location.search)
      newParams.set('from', storedFrom)
      newParams.set('to', storedTo)
      navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
    }
    
    // Marcar como inicializado
    setIsInitialized(true)
  }, [urlFrom, urlTo, location.pathname, navigate])
  
  // Función para actualizar fechas
  const updateDates = (newFrom: string, newTo: string) => {
    console.log('🔄 usePersistentDateFilter - Actualizando fechas:', {
      newFrom,
      newTo,
      currentPath: location.pathname
    })
    
    setFrom(newFrom)
    setTo(newTo)
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY_FROM, newFrom)
    localStorage.setItem(STORAGE_KEY_TO, newTo)
    
    // Actualizar URL
    const newParams = new URLSearchParams(location.search)
    newParams.set('from', newFrom)
    newParams.set('to', newTo)
    navigate(`${location.pathname}?${newParams.toString()}`)
  }
  
  // Función para limpiar fechas (volver al mes actual)
  const clearDates = () => {
    const currentMonth = getCurrentMonthRange()
    updateDates(currentMonth.from, currentMonth.to)
  }
  
  // Función para limpiar localStorage al cerrar sesión
  const clearPersistentDates = () => {
    localStorage.removeItem(STORAGE_KEY_FROM)
    localStorage.removeItem(STORAGE_KEY_TO)
  }
  
  // Determinar si hay un filtro activo
  // Un filtro está activo si:
  // 1. El hook está inicializado
  // 2. Y hay fechas en la URL (usuario seleccionó un filtro explícitamente)
  const hasActiveFilter = Boolean(isInitialized && urlFrom && urlTo)
  
  return {
    from,
    to,
    updateDates,
    clearDates,
    clearPersistentDates,
    hasActiveFilter,
    isInitialized
  }
}
