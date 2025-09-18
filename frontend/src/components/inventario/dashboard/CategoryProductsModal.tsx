"use client"
import { useState } from 'react'

interface Product {
  name: string
  quantity: number
  totalValue: number
}

interface CategoryProductsModalProps {
  category: string | null
  products: Product[]
  open: boolean
  onClose: () => void
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function CategoryProductsModal({ category, products, open, onClose }: CategoryProductsModalProps) {
  if (!open || !category) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl px-8 pt-8 pb-4 flex items-center justify-between border-b">
          <h2 className="text-xl font-bold text-gray-900">{category}</h2>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold ml-4"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {/* Contenido scrollable */}
        <div className="overflow-y-auto px-8 pb-8 text-gray-900" style={{ maxHeight: 'calc(80vh - 64px)' }}>
          {products.length === 0 ? (
            <div className="text-gray-500 text-center">No hay productos en esta categoría.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Producto</th>
                  <th className="py-2 text-right">Cantidad</th>
                  <th className="py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{prod.name}</td>
                    <td className="py-2 text-right text-gray-900">{Number(prod.quantity).toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-900">{currency.format(prod.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// Trigger para usar en Server Component
export function useCategoryProductsModal() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const openModal = (cat: string, prods: Product[]) => {
    setCategory(cat)
    setProducts(prods)
    setOpen(true)
  }
  const closeModal = () => setOpen(false)
  return {
    open,
    category,
    products,
    openModal,
    closeModal,
  }
} 