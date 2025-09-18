'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { ProductAutocomplete } from '../../ProductAutocomplete'

interface Product {
  id: string
  name: string
  category: string
  costPerUnit: number
  unit: string
  minStockLevel: number
}

interface SimpleTreatmentFormProps {
  title: string
  subtipo: string
  items: string[]
  append: (value: any) => void
  fields: any[]
  maxQuantity?: number
  isLoading?: boolean
  error?: string | null
}

export function SimpleTreatmentForm({ 
  title, 
  subtipo, 
  items, 
  append, 
  fields, 
  maxQuantity = 10,
  isLoading = false,
  error = null
}: SimpleTreatmentFormProps) {
  const [selectedItem, setSelectedItem] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [lastAddedItem, setLastAddedItem] = useState('')

  const quickQuantities = [1, 2, 3]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {lastAddedItem && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            ✅ Agregado: {lastAddedItem}
          </div>
        )}
        {isLoading && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            🔄 Cargando productos...
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            ⚠️ Error: {error}
          </div>
        )}
        <div className="text-sm text-blue-600">
          Items en formulario: {fields.length}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda rápida de productos */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium text-blue-800">Búsqueda Rápida</Label>
          </div>
          <ProductAutocomplete
            onProductSelect={(product: Product) => {
              // Auto-agregar el producto seleccionado con cantidad 1
              append({
                subtipo: product.category,
                productId: product.id,
                cantidad: 1,
                categoria: product.category,
              });
              setLastAddedItem(`${product.name} (1)`)
              setTimeout(() => setLastAddedItem(''), 3000)
            }}
            placeholder="Buscar producto por nombre o categoría..."
            className="mb-2"
          />
          <p className="text-xs text-blue-600">
            💡 Busca cualquier producto y se agregará automáticamente
          </p>
        </div>

        {/* Separador visual */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-500">O selecciona manualmente</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Selección manual */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label className="block text-sm font-medium mb-2">Producto</Label>
            <select 
              value={selectedItem} 
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Selecciona un producto</option>
              {items.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <Label className="block text-sm font-medium mb-2">Cantidad</Label>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={() => {
                if (!selectedItem) return;
                append({
                  subtipo: subtipo,
                  productId: selectedItem,
                  cantidad: cantidad,
                  categoria: subtipo,
                });
                setSelectedItem('');
                setCantidad(1);
              }}
              disabled={!selectedItem || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Cantidades rápidas */}
        <div className="flex gap-2">
          <span className="text-sm text-gray-600">Cantidades rápidas:</span>
          {quickQuantities.map(qty => (
            <Button
              key={qty}
              variant="outline"
              size="sm"
              onClick={() => setCantidad(qty)}
              className={cantidad === qty ? 'bg-blue-50 border-blue-200' : ''}
            >
              {qty}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 