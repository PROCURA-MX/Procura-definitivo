import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import axios from 'axios'
import { listenForChanges } from '@/lib/sync-utils'

interface Product {
  id: string
  name: string
  category: string
  costPerUnit: number
  unit: string
  minStockLevel: number
}

interface ProductAutocompleteProps {
  onProductSelect: (product: Product) => void
  placeholder?: string
  className?: string
}

export function ProductAutocomplete({ 
  onProductSelect, 
  placeholder = "Buscar producto...",
  className = ""
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Función para limpiar la búsqueda actual y refrescar
  const refreshSearch = () => {
    console.log('🔄 [ProductAutocomplete] Refrescando búsqueda por cambio en inventario')
    setProducts([])
    setShowDropdown(false)
    setQuery('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // Escuchar cambios en el inventario para refrescar la búsqueda
  useEffect(() => {
    const cleanup = listenForChanges('INVENTARIO', refreshSearch)
    return cleanup
  }, [])

  // Buscar productos
  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setProducts([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.get(`/api/inventory/products/search?q=${encodeURIComponent(searchQuery)}`)
      setProducts(response.data)
      setShowDropdown(response.data.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error buscando productos:', error)
      setProducts([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Manejar selección con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < products.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && products[selectedIndex]) {
          handleProductSelect(products[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Manejar clic en producto
  const handleProductSelect = (product: Product) => {
    onProductSelect(product)
    setQuery('')
    setProducts([])
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && products.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('')
              setProducts([])
              setShowDropdown(false)
              setSelectedIndex(-1)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm">Buscando productos...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="py-1">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.category} • ${product.costPerUnit} por {product.unit}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      Stock min: {product.minStockLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No se encontraron productos</p>
              <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}












          ) : null}
        </div>
      )}
    </div>
  )
}











