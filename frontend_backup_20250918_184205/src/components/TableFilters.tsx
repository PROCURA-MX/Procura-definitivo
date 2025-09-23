import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PacienteSearch from "./PacienteSearch";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
}

interface TableFiltersProps {
  pacientes: Paciente[];
  onFiltersChange: (filters: {
    pacienteId?: string;
  }) => void;
}

export default function TableFilters({ pacientes, onFiltersChange }: TableFiltersProps) {
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const handlePacienteSelect = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    applyFilters(paciente.id);
  };

  const applyFilters = (pacienteId?: string) => {
    onFiltersChange({
      pacienteId,
    });
  };

  const clearFilters = () => {
    setSelectedPaciente(null);
    onFiltersChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Button variant="outline" onClick={clearFilters} size="sm">
          Limpiar filtros
        </Button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Buscar paciente</label>
        <PacienteSearch
          pacientes={pacientes}
          onPacienteSelect={handlePacienteSelect}
          placeholder="Buscar paciente por nombre..."
        />
      </div>
    </div>
  );
} 