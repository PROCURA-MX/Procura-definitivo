import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
}

interface PacienteSearchProps {
  pacientes: Paciente[];
  onPacienteSelect: (paciente: Paciente) => void;
  placeholder?: string;
  selectedPacienteId?: string;
}

export default function PacienteSearch({ 
  pacientes, 
  onPacienteSelect, 
  placeholder = "Buscar paciente por nombre...",
  selectedPacienteId
}: PacienteSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userTyped, setUserTyped] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Si hay paciente seleccionado, inicializar el input solo si no hay texto en el input
  useEffect(() => {
    if (selectedPacienteId && searchTerm === "") {
      const paciente = pacientes.find(p => p.id === selectedPacienteId);
      if (paciente) {
        setSearchTerm(`${paciente.nombre} ${paciente.apellido}`);
        setIsOpen(false);
        setUserTyped(false); // <-- IMPORTANTE
      }
    }
  }, [selectedPacienteId, pacientes, searchTerm]);

  // Búsqueda en el backend cuando cambie el searchTerm
  useEffect(() => {
    const buscarPacientes = async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        try {
          // console.log('🔍 [PacienteSearch] Buscando pacientes con término:', searchTerm); // Comentado para reducir logs
          const response = await api.get(`/pacientes/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
          // console.log('🔍 [PacienteSearch] Respuesta del backend:', response.data); // Comentado para reducir logs
          const resultados = response.data.pacientes || [];
          setFilteredPacientes(resultados.slice(0, 8)); // Limitar a 8 resultados
          if (userTyped) setIsOpen(resultados.length > 0);
        } catch (error) {
          console.error('Error buscando pacientes:', error);
          setFilteredPacientes([]);
          setIsOpen(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFilteredPacientes([]);
        setIsOpen(false);
        setIsSearching(false);
      }
    };

    // Debounce la búsqueda para evitar muchas llamadas
    const timeoutId = setTimeout(buscarPacientes, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, userTyped]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPacientes.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredPacientes.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPacientes.length) {
          selectPaciente(filteredPacientes[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectPaciente = (paciente: Paciente) => {
    setSearchTerm(`${paciente.nombre} ${paciente.apellido}`);
    setIsOpen(false);
    setUserTyped(false); // <-- IMPORTANTE
    onPacienteSelect(paciente);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTyped(true); // <-- IMPORTANTE
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim() && filteredPacientes.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay para permitir que el clic en el dropdown funcione
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="w-full text-gray-900 bg-white h-12 px-4 text-2xl"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isSearching ? (
            <div className="px-4 py-2 text-gray-500 text-sm">
              🔍 Buscando pacientes...
            </div>
          ) : (
            <>
              {filteredPacientes.map((paciente, index) => (
                <div
                  key={paciente.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                    index === selectedIndex ? "bg-blue-100" : ""
                  } text-gray-900`}
                  onClick={() => selectPaciente(paciente)}
                >
                  <div className="font-medium">
                    {paciente.nombre} {paciente.apellido}
                  </div>
                  {paciente.email && (
                    <div className="text-sm text-gray-600">{paciente.email}</div>
                  )}
                  {paciente.telefono && (
                    <div className="text-sm text-gray-500">{paciente.telefono}</div>
                  )}
                </div>
              ))}
              {filteredPacientes.length === 0 && !isSearching && searchTerm.trim().length > 1 && (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  No se encontraron pacientes
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 