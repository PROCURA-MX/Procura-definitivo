"use client"

interface Product {
  name: string
  quantity: number
  category?: string
  expiryDate?: string
  isExpired?: boolean
  isExpiringSoon?: boolean
  status?: string
  daysUntilExpiry?: number
}

interface StockAlertsModalProps {
  products: Product[]
  open: boolean
  onClose: () => void
  title?: string
  isExpiration?: boolean
}

export function StockAlertsModal({ products, open, onClose, title, isExpiration }: StockAlertsModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl px-8 pt-6 pb-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100">
              {isExpiration ? (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title || (isExpiration ? 'Productos por caducar' : 'Productos con stock bajo')}</h2>
              <p className="text-sm text-gray-500">{products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Contenido scrollable */}
        <div className="overflow-y-auto px-8 pb-8" style={{ maxHeight: 'calc(80vh - 64px)' }}>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                {isExpiration ? (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isExpiration ? 'No hay productos por caducar' : 'No hay productos con stock bajo'}
              </h3>
              <p className="text-gray-500">
                {isExpiration 
                  ? 'Todos los productos están dentro de su fecha de vencimiento.' 
                  : 'Todos los productos tienen stock suficiente.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((prod, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{prod.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {prod.quantity} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Categoría: {prod.category || 'Sin categoría'}</span>
                    {isExpiration && prod.expiryDate && (
                      <span className={`px-2 py-1 text-sm font-medium rounded-md ${
                        prod.isExpired 
                          ? 'bg-red-100 text-red-700' 
                          : prod.isExpiringSoon 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {prod.isExpired 
                          ? `Caducado hace ${prod.daysUntilExpiry} días`
                          : prod.isExpiringSoon 
                          ? `Caduca en ${prod.daysUntilExpiry} días`
                          : `Caduca: ${new Date(prod.expiryDate).toLocaleDateString('es-MX')}`
                        }
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 