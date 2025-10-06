import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  costPerUnit: number;
  unit: string;
  minStockLevel: number;
  currentStock?: number;
}

interface ProductAutocompleteProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  categoryName?: string;
}

export default function ProductAutocomplete({ 
  onProductSelect, 
  placeholder = "Buscar producto...", 
  className = "",
  categoryName
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Función para buscar productos
  const searchProducts = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setProducts([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventario/products/search?q=${encodeURIComponent(searchQuery)}${categoryName ? `&category=${encodeURIComponent(categoryName)}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        console.error('Error al buscar productos:', response.statusText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error al buscar productos:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, categoryName]);

  // Manejar selección de producto
  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setProducts([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < products.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < products.length) {
          handleProductSelect(products[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar búsqueda
  const clearSearch = () => {
    setQuery('');
    setProducts([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Buscando productos...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="py-1">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
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
  );
}