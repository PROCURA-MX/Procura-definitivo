'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/useProducts'

const pruebasItemsBackup = [
  'ALEX molecular',
  'Phadiatop',
  'Prick',
  'Prick to prick',
  'Pruebas con alimentos',
  'Suero',
  'FeNO',
  'COVID/Influenza',
  'Estreptococo B',
  'Influenza A y B / Sincitial / Adenovirus',
]

export function PruebasForm({ append }: { append: (value: any[]) => void }) {
  const { products, isLoading, error } = useProducts('PRUEBAS');
  const items = products.length > 0 ? products : pruebasItemsBackup.map(name => ({ id: name, name }));
  const [selected, setSelected] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>(1);

  // Pre-seleccionar producto si viene de búsqueda rápida
  useEffect(() => {
    const selectedProductData = localStorage.getItem('selectedProduct');
    if (selectedProductData) {
      try {
        const product = JSON.parse(selectedProductData);
        // Verificar si el producto está en la lista de pruebas
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
      subtipo: 'PRUEBAS',
      productId: selectedProduct.name, // SIEMPRE usar el nombre del producto
      cantidad: cantidad || 1,
      categoria: 'PRUEBAS',
    }]);
    setSelected('');
    setCantidad(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pruebas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <select value={selected} onChange={e => setSelected(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Selecciona prueba</option>
            {items.map(item => <option key={item.id || item.name} value={item.id || item.name}>{item.name}</option>)}
          </select>
          <input type="number" min={1} value={cantidad} onChange={e => setCantidad(e.target.value === '' ? '' : Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
          <Button type="button" onClick={handleAdd} disabled={!selected} className="bg-blue-600 hover:bg-blue-700">Añadir</Button>
        </div>
        {isLoading && <div className="text-blue-600">Cargando productos...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}
      </CardContent>
    </Card>
  );
} 