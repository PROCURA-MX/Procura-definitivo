import { useState, useEffect, useCallback } from 'react';
import { getConsultoriosUsuario } from '../services/cobrosService';

interface Consultorio {
  id: string;
  nombre: string;
  direccion: string;
  created_at: string;
  updated_at: string;
}

interface ConsultorioUsuario {
  consultorios: Consultorio[];
  userRole: string;
  currentConsultorio: Consultorio;
  canSelectMultiple: boolean;
}

export function useConsultorioSelector() {
  const [consultoriosData, setConsultoriosData] = useState<ConsultorioUsuario | null>(null);
  const [selectedConsultorioId, setSelectedConsultorioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar consultorios del usuario
  const loadConsultorios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConsultoriosUsuario();
      setConsultoriosData(data);
      
      // Si es doctor y puede seleccionar múltiples, seleccionar "Todos" por defecto
      if (data.canSelectMultiple) {
        setSelectedConsultorioId('todos');
      } else {
        // Para otros roles, seleccionar su consultorio asignado
        setSelectedConsultorioId(data.currentConsultorio?.id || null);
      }
    } catch (err: any) {
      console.error('Error cargando consultorios:', err);
      setError(err?.response?.data?.error || 'Error al cargar consultorios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadConsultorios();
  }, [loadConsultorios]);

  // Obtener el consultorio seleccionado
  const getSelectedConsultorio = useCallback(() => {
    if (!consultoriosData) return null;
    
    if (selectedConsultorioId === 'todos') {
      return { id: 'todos', nombre: 'Todos los consultorios', direccion: '' };
    }
    
    return consultoriosData.consultorios.find(c => c.id === selectedConsultorioId) || null;
  }, [consultoriosData, selectedConsultorioId]);

  // Verificar si debe mostrar el selector
  const shouldShowSelector = useCallback(() => {
    return consultoriosData?.canSelectMultiple || false;
  }, [consultoriosData]);

  // Obtener el ID del consultorio para filtrar (null = todos)
  const getFilterConsultorioId = useCallback(() => {
    const filterId = selectedConsultorioId === 'todos' ? null : selectedConsultorioId;
    console.log('🔍 useConsultorioSelector - getFilterConsultorioId:', filterId);
    return filterId;
  }, [selectedConsultorioId]);

  return {
    consultorios: consultoriosData?.consultorios || [],
    selectedConsultorio: getSelectedConsultorio(),
    selectedConsultorioId,
    setSelectedConsultorioId,
    shouldShowSelector,
    getFilterConsultorioId,
    loading,
    error,
    reload: loadConsultorios,
    userRole: consultoriosData?.userRole,
    canSelectMultiple: consultoriosData?.canSelectMultiple || false
  };
}
