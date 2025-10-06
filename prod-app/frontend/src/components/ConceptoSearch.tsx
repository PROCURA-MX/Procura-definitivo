import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface Concepto {
  id: string;
  nombre: string;
  precio_base: number;
}

interface ConceptoSearchProps {
  conceptos: Concepto[];
  value?: string; // id del concepto seleccionado
  onChange?: (concepto: Concepto | null) => void;
  placeholder?: string;
}

export default function ConceptoSearch({ 
  conceptos, 
  value,
  onChange,
  placeholder = "Buscar concepto por nombre..." 
}: ConceptoSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConceptos, setFilteredConceptos] = useState<Concepto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mostrar el nombre del concepto seleccionado si value existe
  const selectedConcepto = conceptos.find(c => c.id === value);
  const displayValue = selectedConcepto ? selectedConcepto.nombre : searchTerm;

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredConceptos([]);
      setIsOpen(false);
      return;
    }
    const filtered = conceptos.filter(concepto => {
      const nombre = concepto.nombre.toLowerCase();
      const search = searchTerm.toLowerCase();
      return nombre.includes(search);
    });
    setFilteredConceptos(filtered.slice(0, 8));
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, conceptos]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => prev < filteredConceptos.length - 1 ? prev + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredConceptos.length - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredConceptos.length) {
          selectConcepto(filteredConceptos[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectConcepto = (concepto: Concepto) => {
    setSearchTerm("");
    setIsOpen(false);
    if (onChange) onChange(concepto);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Si el usuario está escribiendo, entrar en modo búsqueda
    // Solo limpiar la selección si hay un concepto seleccionado y el texto no coincide
    if (onChange && selectedConcepto && newValue !== selectedConcepto.nombre) {
      onChange(null);
    }
  };

  const handleInputFocus = () => {
    // Si hay un concepto seleccionado, permitir editar su nombre
    if (selectedConcepto) {
      setSearchTerm(selectedConcepto.nombre);
    }
    
    if (searchTerm.trim() && filteredConceptos.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="w-full text-gray-900 bg-white h-12 px-4 text-2xl"
        autoComplete="off"
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredConceptos.map((concepto, index) => (
            <div
              key={concepto.id}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? "bg-blue-100" : ""} text-gray-900`}
              onClick={() => selectConcepto(concepto)}
            >
              <div className="font-medium">
                {concepto.nombre} (${concepto.precio_base})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 