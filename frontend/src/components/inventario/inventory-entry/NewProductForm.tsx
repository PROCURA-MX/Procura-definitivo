"use client";

import React, { useState } from 'react';
import axios from 'axios';
import { notifyChange } from '@/lib/sync-utils';

// Enums definidos localmente (matching Prisma schema)
enum ProductType {
  SIMPLE = 'SIMPLE',
  COMPLEX = 'COMPLEX'
}

enum ProductUnit {
  ML = 'ML',
  PIECE = 'PIECE'
}

interface NewProductFormProps {
  onProductCreated: (product: { id: string; name: string }) => void;
  onCancel: () => void;
  selectedCategory: string;
  // Datos adicionales para auto-entrada
  quantity?: number;
  price?: number;
  mlPerVial?: number;
  expiryDate?: string;
  sedeId?: string;
  consultorioId?: string;
  userId?: string;
}

export default function NewProductForm({ 
  onProductCreated, 
  onCancel, 
  selectedCategory,
  quantity,
  price,
  mlPerVial,
  expiryDate,
  sedeId,
  consultorioId,
  userId
}: NewProductFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>(ProductType.SIMPLE);
  const [unit, setUnit] = useState<ProductUnit>(ProductUnit.PIECE);
  const [description, setDescription] = useState('');
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(10);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar el tipo y unidad por defecto basado en la categoría
  React.useEffect(() => {
    if (selectedCategory === 'Alérgenos Alxoid') {
      setType(ProductType.COMPLEX);
      setUnit(ProductUnit.ML);
    } else if (selectedCategory === 'Alérgenos') {
      setType(ProductType.SIMPLE);
      setUnit(ProductUnit.ML);
    } else {
      setType(ProductType.SIMPLE);
      setUnit(ProductUnit.PIECE);
    }
  }, [selectedCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del producto es requerido');
      return;
    }
    if (costPerUnit <= 0) {
      setError('El costo por unidad debe ser mayor a 0');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      console.log('🔍 [NewProductForm] Enviando datos al backend:', {
        name: name.trim(),
        category: selectedCategory,
        costPerUnit,
        quantity,
        price,
        mlPerVial,
        sedeId,
        consultorioId,
        userId
      });

      const response = await axios.post('/api/inventory/products', {
        name: name.trim(),
        type,
        unit,
        description: description.trim() || undefined,
        costPerUnit,
        minStockLevel,
        category: selectedCategory,
        // Datos adicionales para auto-entrada
        quantity,
        price,
        mlPerVial,
        expiryDate,
        supplierName: 'Proveedor demo', // TODO: integrar proveedor real
        sedeId,
        consultorioId,
        userId
      });

      console.log('✅ [NewProductForm] Respuesta del backend:', response.data);
      
      const newProduct = response.data.product;
      
      // Notificar a otros componentes que se creó un nuevo producto
      notifyChange('INVENTARIO');
      console.log('🔄 [NewProductForm] Notificación de inventario enviada');
      
      onProductCreated(newProduct);
    } catch (err: any) {
      console.error('❌ [NewProductForm] Error:', err);
      
      // Manejar errores específicos del backend
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 409) {
        setError('Ya existe un producto con este nombre en tu organización');
      } else {
        setError(err instanceof Error ? err.message : 'Error al crear el producto');
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Nuevo Producto - {selectedCategory}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Nombre del Producto *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Ingrese el nombre del producto"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Descripción del producto"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value={ProductType.SIMPLE}>Simple</option>
              <option value={ProductType.COMPLEX}>Complejo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Unidad
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value={ProductUnit.PIECE}>Pieza</option>
              <option value={ProductUnit.ML}>Mililitros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Costo por Unidad *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Stock Mínimo
            </label>
            <input
              type="number"
              min="1"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="10"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creando...' : 'Crear Producto'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
} 
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value={ProductUnit.PIECE}>Pieza</option>
              <option value={ProductUnit.ML}>Mililitros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Costo por Unidad *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Stock Mínimo
            </label>
            <input
              type="number"
              min="1"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="10"
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creando...' : 'Crear Producto'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
} 