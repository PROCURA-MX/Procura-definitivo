import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

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
  const [userTyped, setUserTyped] = useState(false); // <-- Nuevo estado
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

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPacientes([]);
      setIsOpen(false);
      return;
    }

    const filtered = pacientes.filter(paciente => {
      const fullName = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.startsWith(search) || 
             paciente.nombre.toLowerCase().startsWith(search) || 
             paciente.apellido.toLowerCase().startsWith(search);
    });

    setFilteredPacientes(filtered.slice(0, 8)); // Limitar a 8 resultados
    // Solo abrir el dropdown si el usuario está escribiendo
    if (userTyped) setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, pacientes, userTyped]);

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
        </div>
      )}
    </div>
  );
} 