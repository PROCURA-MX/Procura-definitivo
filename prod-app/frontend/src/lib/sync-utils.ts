/**
 * Utilidades para sincronización automática entre componentes
 */

export const SYNC_EVENTS = {
  COBROS: 'cobros-updated',
  INVENTARIO: 'inventario-updated',
  DISPONIBILIDAD: 'disponibilidades-updated',
  BLOQUEOS: 'bloqueos-updated',
  CONCEPTOS: 'conceptos-updated'
} as const

/**
 * Notifica cambios a otros componentes
 * @param eventType - Tipo de evento de sincronización
 */
export function notifyChange(eventType: keyof typeof SYNC_EVENTS) {
  const eventName = SYNC_EVENTS[eventType]
  const timestamp = Date.now().toString()
  
  // Guardar en localStorage para otras pestañas
  localStorage.setItem(`${eventType}_updated`, timestamp)
  
  // Disparar evento personalizado para la misma pestaña
  window.dispatchEvent(new CustomEvent(eventName, { detail: { timestamp } }))
  
  console.log(`🔄 Notificación de cambio enviada: ${eventName}`)
}

/**
 * Escucha cambios de un tipo específico
 * @param eventType - Tipo de evento a escuchar
 * @param callback - Función a ejecutar cuando hay cambios
 */
export function listenForChanges(
  eventType: keyof typeof SYNC_EVENTS, 
  callback: () => void
) {
  const eventName = SYNC_EVENTS[eventType]
  
  // Escuchar eventos personalizados (misma pestaña)
  const handleCustomEvent = () => {
    console.log(`🔄 Evento personalizado detectado: ${eventName}`)
    callback()
  }
  
  // Escuchar cambios de localStorage (otras pestañas)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `${eventType}_updated`) {
      console.log(`🔄 Cambio de localStorage detectado: ${eventName}`)
      callback()
      localStorage.removeItem(`${eventType}_updated`)
    }
  }
  
  window.addEventListener(eventName, handleCustomEvent)
  window.addEventListener('storage', handleStorageChange)
  
  // Retornar función para limpiar listeners
  return () => {
    window.removeEventListener(eventName, handleCustomEvent)
    window.removeEventListener('storage', handleStorageChange)
  }
} 