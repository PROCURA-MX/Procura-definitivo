import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion?: string;
  documento_identidad?: string;
}

interface PacienteAutocompleteProps {
  value?: Paciente | null;
  onChange: (paciente: Paciente | null) => void;
  onError?: (error: string) => void;
}

export function PacienteAutocomplete({ value, onChange, onError }: PacienteAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewPacienteModal, setShowNewPacienteModal] = useState(false);
  // Mover el estado fuera del modal
  const [newPaciente, setNewPaciente] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    email: '',
    direccion: '',
    documento_identidad: ''
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Buscar pacientes en el backend
  const searchPacientes = async (query: string) => {
    if (query.length < 1) {
      setPacientes([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/pacientes/search?q=${encodeURIComponent(query)}`);
      setPacientes(response.data);
    } catch (error) {
      onError?.('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nuevo paciente
  const createPaciente = async () => {
    setFormError(null);
    // Validar campos requeridos
    if (!newPaciente.nombre || !newPaciente.apellido || !newPaciente.fecha_nacimiento || !newPaciente.genero || !newPaciente.telefono || !newPaciente.email) {
      setFormError('Todos los campos marcados con * son obligatorios.');
      return;
    }
    try {
      const payload = {
        nombre: newPaciente.nombre,
        apellido: newPaciente.apellido,
        fecha_nacimiento: newPaciente.fecha_nacimiento,
        genero: newPaciente.genero,
        telefono: newPaciente.telefono,
        email: newPaciente.email
      };
            const response = await api.post('/pacientes', payload);
      const pacienteCreado = response.data;
      onChange(pacienteCreado);
      setShowNewPacienteModal(false);
      setNewPaciente({
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: '',
        telefono: '',
        email: '',
        direccion: '',
        documento_identidad: ''
      });
      setSearchTerm(`${pacienteCreado.nombre} ${pacienteCreado.apellido}`);
    } catch (error: any) {
      let errorMsg = 'Error al crear paciente';
      if (error?.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      setFormError(errorMsg);
      onError?.(errorMsg);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setPacientes([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchPacientes(searchTerm);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mouseup', handleClickOutside);
    return () => document.removeEventListener('mouseup', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // Si se borra todo, limpiar selección
    if (!value) {
      setPacientes([]);
      onChange(null);
    }
  };

  const handleSelectPaciente = (paciente: Paciente) => {
    onChange(paciente);
    setSearchTerm(`${paciente.nombre} ${paciente.apellido}`);
    setShowDropdown(false);
  };

  const displayValue = value ? `${value.nombre} ${value.apellido}` : searchTerm;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Buscar paciente..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          className="flex-1"
        />
        <Dialog open={showNewPacienteModal} onOpenChange={setShowNewPacienteModal}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              + Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {formError && (
                <div className="bg-red-100 border border-red-300 text-red-700 rounded p-2 text-sm mb-2">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={newPaciente.nombre}
                    onChange={e => setNewPaciente(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    className="text-gray-900 bg-white !text-black !bg-white"
                    style={{ color: 'black', background: 'white' }}
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={newPaciente.apellido}
                    onChange={e => setNewPaciente(prev => ({ ...prev, apellido: e.target.value }))}
                    required
                    className="text-gray-900 bg-white !text-black !bg-white"
                    style={{ color: 'black', background: 'white' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={newPaciente.fecha_nacimiento}
                    onChange={e => setNewPaciente(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                    required
                    className="text-gray-900 bg-white !text-black !bg-white"
                    style={{ color: 'black', background: 'white' }}
                  />
                </div>
                <div>
                  <Label htmlFor="genero">Género *</Label>
                  <Select value={newPaciente.genero} onValueChange={value => setNewPaciente(prev => ({ ...prev, genero: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={newPaciente.telefono}
                    onChange={e => setNewPaciente(prev => ({ ...prev, telefono: e.target.value }))}
                    required
                    className="text-gray-900 bg-white !text-black !bg-white"
                    style={{ color: 'black', background: 'white' }}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPaciente.email}
                    onChange={e => setNewPaciente(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="text-gray-900 bg-white !text-black !bg-white"
                    style={{ color: 'black', background: 'white' }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={newPaciente.direccion}
                  onChange={e => setNewPaciente(prev => ({ ...prev, direccion: e.target.value }))}
                  className="text-gray-900 bg-white !text-black !bg-white"
                  style={{ color: 'black', background: 'white' }}
                />
              </div>

              <div>
                <Label htmlFor="documento_identidad">Documento de Identidad</Label>
                <Input
                  id="documento_identidad"
                  value={newPaciente.documento_identidad}
                  onChange={e => setNewPaciente(prev => ({ ...prev, documento_identidad: e.target.value }))}
                  className="text-gray-900 bg-white !text-black !bg-white"
                  style={{ color: 'black', background: 'white' }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewPacienteModal(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={createPaciente}>
                  Guardar Paciente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (pacientes.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Buscando...</div>
          ) : (
            pacientes.map((paciente) => {
              return (
                <div
                  key={paciente.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectPaciente(paciente)}
                >
                  <div className="font-medium">{paciente.nombre} {paciente.apellido}</div>
                  <div className="text-sm text-gray-500">
                    {paciente.telefono} • {paciente.email}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Mensaje si no hay resultados */}
      {showDropdown && !isLoading && pacientes.length === 0 && searchTerm.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          No se encontraron pacientes. Usa "Nuevo" para agregar uno.
        </div>
      )}
    </div>
  );
} 