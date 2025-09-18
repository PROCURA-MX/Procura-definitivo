'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/useProducts'

// Lista de respaldo en caso de que la API falle
const vacunasPediatricasItemsBackup = [
  'Adacel Boost',
  'Gardasil',
  'Gardasil 9',
  'Hepatitis A y B',
  'Fiebre Amarilla',
  'Herpes Zóster',
  'Hexacima',
  'Influenza',
  'Menactra',
  'MMR',
  'Prevenar 13',
  'V Proquad',
  'Pulmovax',
  'Rota Teq',
  'Vaqta',
  'Varivax',
]

export function VacunasPediatricasForm({ append }: { append: (value: any[]) => void }) {
  const { products, isLoading, error } = useProducts('VACUNAS_PEDIATRICAS');
  const items = products.length > 0 ? products : vacunasPediatricasItemsBackup.map(name => ({ id: name, name }));
  const [selected, setSelected] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>(1);

  // Pre-seleccionar producto si viene de búsqueda rápida
  useEffect(() => {
    const selectedProductData = localStorage.getItem('selectedProduct');
    if (selectedProductData) {
      try {
        const product = JSON.parse(selectedProductData);
        // Verificar si el producto está en la lista de vacunas pediátricas
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
      subtipo: 'VACUNAS_PEDIATRICAS',
      productId: selectedProduct.name, // SIEMPRE usar el nombre del producto
      cantidad: cantidad || 1,
      categoria: 'VACUNAS_PEDIATRICAS',
    }]);
    setSelected('');
    setCantidad(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vacunas Pediátricas</CardTitle>
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
            <label className="block text-sm font-medium mb-2">Vacuna</label>
            <select 
              value={selected} 
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Selecciona vacuna</option>
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