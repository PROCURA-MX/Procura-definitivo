'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/useProducts'

const consultaItemsBackup = [
  'Consulta',
]

export function ConsultaForm({ append }: { append: (value: any[]) => void }) {
  const { products, isLoading, error } = useProducts('CONSULTA');
  const items = products.length > 0 ? products : consultaItemsBackup.map(name => ({ id: name, name }));
  const [selected, setSelected] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>(1);

  // Pre-seleccionar producto si viene de búsqueda rápida
  useEffect(() => {
    const selectedProductData = localStorage.getItem('selectedProduct');
    if (selectedProductData) {
      try {
        const product = JSON.parse(selectedProductData);
        // Verificar si el producto está en la lista de consulta
        if (items.some(item => item.name === product.name)) {
          setSelected(product.id || product.name);
        }
        // Limpiar localStorage después de usarlo
        localStorage.removeItem('selectedProduct');
      } catch (error) {
        console.error('Error parsing selected product:', error);
        localStorage.removeItem('selectedProduct');
      }
    }
  }, [items]);

  const handleAdd = () => {
    if (!selected) return;
    
    // Encontrar el producto seleccionado para obtener su ID
    const selectedProduct = items.find(item => (item.id || item.name) === selected);
    if (!selectedProduct) return;
    
    append([{
      subtipo: 'CONSULTA',
      productId: selectedProduct.name, // SIEMPRE usar el nombre del producto
      cantidad: cantidad || 1,
      categoria: 'CONSULTA',
    }]);
    setSelected('');
    setCantidad(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta</CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tipo de Consulta</label>
            <select 
              value={selected} 
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Selecciona tipo de consulta</option>
              {items.map(item => (
                <option key={item.id || item.name} value={item.id || item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-2">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleAdd}
              disabled={!selected || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Agregar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 