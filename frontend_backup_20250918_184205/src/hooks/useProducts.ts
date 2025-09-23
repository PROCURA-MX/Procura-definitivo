import { useState, useEffect } from 'react';
import axios from 'axios';
import { listenForChanges } from '@/lib/sync-utils';

interface Product {
  id: string;
  name: string;
}

export function useProducts(categoryName?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar productos
  const fetchProducts = async (retries = 3) => {
    let lastError: any = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = categoryName 
          ? `/api/inventory/products/category/${encodeURIComponent(categoryName)}`
          : '/api/inventory/products';
        
        console.log('🔍 [useProducts] Cargando productos desde:', url);
        const response = await axios.get(url);
        
        const data = response.data;
        console.log('✅ [useProducts] Productos cargados:', data.length, 'productos para categoría:', categoryName);
        console.log('🔍 [useProducts] Productos encontrados:', data);
        setProducts(data);
        setIsLoading(false);
        setError(null);
        return;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          // Espera 2 segundos antes de reintentar
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    }
    setError(lastError instanceof Error ? lastError.message : 'Error desconocido');
    setIsLoading(false);
  };

  useEffect(() => {
    // Cargar productos inicialmente
    fetchProducts();
  }, [categoryName]);

  // Escuchar cambios en el inventario para refrescar la lista
  useEffect(() => {
    const cleanup = listenForChanges('INVENTARIO', () => {
      console.log('🔄 [useProducts] Refrescando productos por cambio en inventario para categoría:', categoryName);
      fetchProducts();
    });
    return cleanup;
  }, [categoryName]);

  return { products, isLoading, error };
} 
  useEffect(() => {
    const cleanup = listenForChanges('INVENTARIO', () => {
      console.log('🔄 [useProducts] Refrescando productos por cambio en inventario para categoría:', categoryName);
      fetchProducts();
    });
    return cleanup;
  }, [categoryName]);

  return { products, isLoading, error };
} 