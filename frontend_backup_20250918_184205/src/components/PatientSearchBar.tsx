import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, User, Phone, Mail, Calendar } from "lucide-react";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  genero?: string;
}

interface PatientSearchBarProps {
  pacientes: Paciente[];
  onSearchResults: (results: Paciente[]) => void;
  onClearSearch: () => void;
  placeholder?: string;
  className?: string;
}

type SearchFilter = 'all' | 'name' | 'email' | 'phone' | 'date';

export default function PatientSearchBar({ 
  pacientes, 
  onSearchResults, 
  onClearSearch,
  placeholder = "Buscar pacientes por nombre, email, teléfono...",
  className = ""
}: PatientSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función de búsqueda optimizada con debounce
  const performSearch = (term: string, filter: SearchFilter) => {
    if (!term.trim()) {
      onClearSearch();
      setHasResults(false);
      return;
    }

    setIsSearching(true);
    
    const searchLower = term.toLowerCase().trim();
    const results = pacientes.filter(paciente => {
      switch (filter) {
        case 'name':
          return `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchLower) ||
                 paciente.nombre.toLowerCase().includes(searchLower) ||
                 paciente.apellido.toLowerCase().includes(searchLower);
        
        case 'email':
          return paciente.email?.toLowerCase().includes(searchLower) || false;
        
        case 'phone':
          return paciente.telefono?.includes(searchLower) || false;
        
        case 'date':
          if (!paciente.fecha_nacimiento) return false;
          const dateStr = paciente.fecha_nacimiento.slice(0, 10);
          return dateStr.includes(searchLower) || 
                 new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES').includes(searchLower);
        
        case 'all':
        default:
          return `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchLower) ||
                 paciente.nombre.toLowerCase().includes(searchLower) ||
                 paciente.apellido.toLowerCase().includes(searchLower) ||
                 paciente.email?.toLowerCase().includes(searchLower) ||
                 paciente.telefono?.includes(searchLower) ||
                 (paciente.fecha_nacimiento && (
                   paciente.fecha_nacimiento.slice(0, 10).includes(searchLower) ||
                   new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES').includes(searchLower)
                 ));
      }
    });

    onSearchResults(results);
    setHasResults(results.length > 0);
    setIsSearching(false);
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm, searchFilter);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchFilter, pacientes]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchFilter('all');
    onClearSearch();
    setHasResults(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };

  const getFilterIcon = (filter: SearchFilter) => {
    switch (filter) {
      case 'name': return <User className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (filter: SearchFilter) => {
    switch (filter) {
      case 'name': return 'Nombre';
      case 'email': return 'Email';
      case 'phone': return 'Teléfono';
      case 'date': return 'Fecha';
      default: return 'Todo';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-14 pl-12 pr-20 text-lg border-2 border-gray-200 focus:border-[#4285f2] rounded-xl shadow-sm transition-all duration-200 text-black"
        />
        
        {/* Botón de filtros */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3 rounded-lg transition-colors ${
              showFilters || searchFilter !== 'all' 
                ? 'bg-[#4285f2] text-white hover:bg-[#4285f2]/90' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-10 w-10 p-0 ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'name', 'email', 'phone', 'date'] as SearchFilter[]).map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={searchFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchFilter(filter)}
                className={`flex items-center gap-2 transition-all ${
                  searchFilter === filter 
                    ? 'bg-[#4285f2] text-white border-[#4285f2]' 
                    : 'text-white border-gray-300 hover:border-[#4285f2] hover:text-[#4285f2]'
                }`}
              >
                {getFilterIcon(filter)}
                {getFilterLabel(filter)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de búsqueda activa */}
      {searchTerm && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4285f2]"></div>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>
                  {hasResults 
                    ? `Encontrados resultados para "${searchTerm}"` 
                    : `Sin resultados para "${searchTerm}"`
                  }
                </span>
                {searchFilter !== 'all' && (
                  <span className="text-[#4285f2] font-medium">
                    (filtro: {getFilterLabel(searchFilter)})
                  </span>
                )}
              </>
            )}
          </div>
          
          {hasResults && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-[#4285f2] hover:text-[#4285f2]/80 hover:bg-[#4285f2]/10"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Search, X, Filter, User, Phone, Mail, Calendar } from "lucide-react";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  genero?: string;
}

interface PatientSearchBarProps {
  pacientes: Paciente[];
  onSearchResults: (results: Paciente[]) => void;
  onClearSearch: () => void;
  placeholder?: string;
  className?: string;
}

type SearchFilter = 'all' | 'name' | 'email' | 'phone' | 'date';

export default function PatientSearchBar({ 
  pacientes, 
  onSearchResults, 
  onClearSearch,
  placeholder = "Buscar pacientes por nombre, email, teléfono...",
  className = ""
}: PatientSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función de búsqueda optimizada con debounce
  const performSearch = (term: string, filter: SearchFilter) => {
    if (!term.trim()) {
      onClearSearch();
      setHasResults(false);
      return;
    }

    setIsSearching(true);
    
    const searchLower = term.toLowerCase().trim();
    const results = pacientes.filter(paciente => {
      switch (filter) {
        case 'name':
          return `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchLower) ||
                 paciente.nombre.toLowerCase().includes(searchLower) ||
                 paciente.apellido.toLowerCase().includes(searchLower);
        
        case 'email':
          return paciente.email?.toLowerCase().includes(searchLower) || false;
        
        case 'phone':
          return paciente.telefono?.includes(searchLower) || false;
        
        case 'date':
          if (!paciente.fecha_nacimiento) return false;
          const dateStr = paciente.fecha_nacimiento.slice(0, 10);
          return dateStr.includes(searchLower) || 
                 new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES').includes(searchLower);
        
        case 'all':
        default:
          return `${paciente.nombre} ${paciente.apellido}`.toLowerCase().includes(searchLower) ||
                 paciente.nombre.toLowerCase().includes(searchLower) ||
                 paciente.apellido.toLowerCase().includes(searchLower) ||
                 paciente.email?.toLowerCase().includes(searchLower) ||
                 paciente.telefono?.includes(searchLower) ||
                 (paciente.fecha_nacimiento && (
                   paciente.fecha_nacimiento.slice(0, 10).includes(searchLower) ||
                   new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES').includes(searchLower)
                 ));
      }
    });

    onSearchResults(results);
    setHasResults(results.length > 0);
    setIsSearching(false);
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm, searchFilter);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchFilter, pacientes]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchFilter('all');
    onClearSearch();
    setHasResults(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };

  const getFilterIcon = (filter: SearchFilter) => {
    switch (filter) {
      case 'name': return <User className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (filter: SearchFilter) => {
    switch (filter) {
      case 'name': return 'Nombre';
      case 'email': return 'Email';
      case 'phone': return 'Teléfono';
      case 'date': return 'Fecha';
      default: return 'Todo';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Barra de búsqueda principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-14 pl-12 pr-20 text-lg border-2 border-gray-200 focus:border-[#4285f2] rounded-xl shadow-sm transition-all duration-200 text-black"
        />
        
        {/* Botón de filtros */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3 rounded-lg transition-colors ${
              showFilters || searchFilter !== 'all' 
                ? 'bg-[#4285f2] text-white hover:bg-[#4285f2]/90' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-10 w-10 p-0 ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'name', 'email', 'phone', 'date'] as SearchFilter[]).map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={searchFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchFilter(filter)}
                className={`flex items-center gap-2 transition-all ${
                  searchFilter === filter 
                    ? 'bg-[#4285f2] text-white border-[#4285f2]' 
                    : 'text-white border-gray-300 hover:border-[#4285f2] hover:text-[#4285f2]'
                }`}
              >
                {getFilterIcon(filter)}
                {getFilterLabel(filter)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de búsqueda activa */}
      {searchTerm && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4285f2]"></div>
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>
                  {hasResults 
                    ? `Encontrados resultados para "${searchTerm}"` 
                    : `Sin resultados para "${searchTerm}"`
                  }
                </span>
                {searchFilter !== 'all' && (
                  <span className="text-[#4285f2] font-medium">
                    (filtro: {getFilterLabel(searchFilter)})
                  </span>
                )}
              </>
            )}
          </div>
          
          {hasResults && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-[#4285f2] hover:text-[#4285f2]/80 hover:bg-[#4285f2]/10"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
