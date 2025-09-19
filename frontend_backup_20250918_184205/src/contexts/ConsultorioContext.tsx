import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getConsultoriosUsuario } from '../services/cobrosService';

interface Consultorio {
  id: string;
  nombre: string;
  direccion: string;
  created_at: string;
  updated_at: string;
}

interface ConsultorioContextType {
  consultorios: Consultorio[];
  selectedConsultorioId: string | null;
  setSelectedConsultorioId: (id: string) => void;
  shouldShowSelector: boolean;
  loading: boolean;
  error: string | null;
  getFilterConsultorioId: () => string | null;
  reload: () => Promise<void>;
}

const ConsultorioContext = createContext<ConsultorioContextType | undefined>(undefined);

export function ConsultorioProvider({ children }: { children: ReactNode }) {
  console.log('🔍 ConsultorioContext - Provider inicializándose...');
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [selectedConsultorioId, setSelectedConsultorioIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canSelectMultiple, setCanSelectMultiple] = useState(false);

  // Cargar consultorios del usuario
  const loadConsultorios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConsultoriosUsuario();
      console.log('🔍 ConsultorioContext - Datos recibidos del endpoint:', data);
      setConsultorios(data.consultorios);
      setCanSelectMultiple(data.canSelectMultiple);
      
      // Si es doctor y puede seleccionar múltiples, seleccionar "Todos" por defecto
      if (data.canSelectMultiple) {
        console.log('🔍 ConsultorioContext - Es doctor, seleccionando "todos"');
        setSelectedConsultorioIdState('todos');
      } else {
        // Para otros roles, seleccionar su consultorio asignado
        console.log('🔍 ConsultorioContext - No es doctor, consultorio asignado:', data.currentConsultorio);
        setSelectedConsultorioIdState(data.currentConsultorio?.id || null);
      }
    } catch (err: any) {
      console.error('Error cargando consultorios:', err);
      setError(err?.response?.data?.error || 'Error al cargar consultorios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  React.useEffect(() => {
    console.log('🔍 ConsultorioContext - useEffect ejecutándose, cargando consultorios...');
    loadConsultorios();
  }, [loadConsultorios]);

  // Función para cambiar el consultorio seleccionado
  const setSelectedConsultorioId = useCallback((id: string) => {
    console.log('🔍 ConsultorioContext - Cambiando consultorio a:', id);
    setSelectedConsultorioIdState(id);
  }, []);

  // Obtener el ID del consultorio para filtrar ('todos' = todos, null = sin filtro)
  const getFilterConsultorioId = useCallback(() => {
    const filterId = selectedConsultorioId;
    console.log('🔍 ConsultorioContext - getFilterConsultorioId:', filterId);
    // Si es 'todos', devolver 'todos' para mostrar todos los cobros
    return filterId;
  }, [selectedConsultorioId]);

  // Verificar si debe mostrar el selector
  const shouldShowSelector = canSelectMultiple;

  const value: ConsultorioContextType = {
    consultorios,
    selectedConsultorioId,
    setSelectedConsultorioId,
    shouldShowSelector,
    loading,
    error,
    getFilterConsultorioId,
    reload: loadConsultorios
  };

  return (
    <ConsultorioContext.Provider value={value}>
      {children}
    </ConsultorioContext.Provider>
  );
}

export function useConsultorioContext() {
  const context = useContext(ConsultorioContext);
  if (context === undefined) {
    throw new Error('useConsultorioContext must be used within a ConsultorioProvider');
  }
  return context;
}
