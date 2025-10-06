import { useState, useEffect } from 'react';
import api from '../services/api';

interface Consultorio {
  id: string;
  name?: string;
  sedeId?: string;
}

interface Sede {
  id: string;
  name: string;
}

interface ConsultorioSedeMapping {
  consultorios: Consultorio[];
  sedes: Sede[];
}

// Interfaz para la respuesta del endpoint
interface ApiResponse {
  mapping: {
    [consultorioId: string]: string; // consultorioId -> sedeId
  };
}

export function useConsultorioSedeMapping() {
  const [mapping, setMapping] = useState<ConsultorioSedeMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMapping() {
      try {
        console.log('🔍 Hook - Iniciando fetch de consultorios-sedes...');
        setLoading(true);
        const response = await api.get('/inventory/consultorios-sedes?t=' + Date.now());
        console.log('✅ Hook - Datos recibidos:', response.data);
        
        // Convertir el formato del endpoint al formato esperado por el hook
        const apiData: ApiResponse = response.data;
        const convertedMapping: ConsultorioSedeMapping = {
          consultorios: [],
          sedes: []
        };

        // Convertir el mapping del endpoint al formato esperado
        Object.entries(apiData.mapping).forEach(([consultorioId, sedeId]) => {
          convertedMapping.consultorios.push({
            id: consultorioId,
            sedeId: sedeId,
            name: consultorioId === '660e8400-e29b-41d4-a716-446655440000' ? 'Consultorio Principal' :
                  consultorioId === '2616a3f9-4d05-47d6-bc43-529981ca1025' ? 'Teca' :
                  consultorioId === 'todos' ? 'Todos los consultorios' : 'Desconocido'
          });
          
          // Agregar sede si no existe (EXCLUIR sedeId falso)
          if (!convertedMapping.sedes.find(s => s.id === sedeId) && sedeId !== 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21') {
            convertedMapping.sedes.push({
              id: sedeId,
              name: sedeId === 'sede-consultorio-teca-001' ? 'Sede Teca' :
                    sedeId === 'sede-consultorio-norte-001' ? 'Sede Norte' :
                    sedeId === 'sede-tecamachalco' ? 'Sede Tecamachalco' :
                    sedeId === 'todos' ? 'Todas las sedes' : 'Desconocida'
            });
          }
        });

        setMapping(convertedMapping);
        setError(null);
      } catch (err: any) {
        console.error('❌ Hook - Error fetching consultorio-sede mapping:', err);
        
        // Si es error de autenticación, no mostrar error al usuario
        if (err?.response?.status === 401) {
          console.log('🔐 Hook - Usuario no autenticado, usando fallback');
          setError(null); // No mostrar error de autenticación
        } else {
          setError('Error al cargar el mapeo de consultorios');
        }
      } finally {
        setLoading(false);
        console.log('🏁 Hook - Fetch completado, loading:', false);
      }
    }

    fetchMapping();
  }, []);

  // Función para obtener sedeId desde consultorioId
  const getSedeIdFromConsultorio = (consultorioId: string): string => {
    console.log('🔍 Hook - getSedeIdFromConsultorio llamado con:', consultorioId);
    console.log('🔍 Hook - mapping disponible:', !!mapping);
    
    // Caso especial: "todos" debe devolver un valor especial
    if (consultorioId === 'todos') {
      console.log('🌐 Hook - Caso especial: todos los consultorios');
      return 'todos';
    }
    
    if (!mapping) {
      // Si no hay mapping disponible, esperar a que se cargue
      console.log('⏳ Hook - Mapping no disponible, esperando carga...');
      return 'loading'; // Indicador de que está cargando
    }
    
    const consultorio = mapping.consultorios.find(c => c.id === consultorioId);
    if (!consultorio) {
      console.log('❌ Hook - Consultorio no encontrado:', consultorioId);
      return 'not-found'; // Indicador de que no se encontró
    }
    
    const result = consultorio.sedeId || 'not-found';
    console.log('✅ Hook - Usando mapping dinámico, resultado:', result);
    return result;
  };

  // Función específica para operaciones de inventario que siempre devuelve un sedeId válido
  const getSedeIdForInventory = (consultorioId: string): string => {
    console.log('🔍 Hook - getSedeIdForInventory llamado con:', consultorioId);
    
    // Para operaciones de inventario, nunca usar "todos"
    if (consultorioId === 'todos') {
      console.log('⚠️ Hook - Operación de inventario con "todos", usando consultorio principal');
      // Buscar el primer consultorio disponible como fallback
      if (mapping && mapping.consultorios.length > 0) {
        const firstConsultorio = mapping.consultorios[0];
        console.log('🔄 Hook - Usando primer consultorio disponible:', firstConsultorio.sedeId);
        return firstConsultorio.sedeId || 'loading';
      }
      return 'loading'; // Si no hay mapping, esperar
    }
    
    // Usar la función normal para otros casos
    return getSedeIdFromConsultorio(consultorioId);
  };

  // Función para obtener nombre del consultorio
  const getConsultorioName = (consultorioId: string): string => {
    if (!mapping) return 'Desconocido';
    
    const consultorio = mapping.consultorios.find(c => c.id === consultorioId);
    return consultorio?.name || 'Desconocido';
  };

  // Función para obtener nombre de la sede
  const getSedeName = (sedeId: string): string => {
    if (!mapping) return 'Desconocida';
    
    const sede = mapping.sedes.find(s => s.id === sedeId);
    return sede?.name || 'Desconocida';
  };

  return {
    mapping,
    loading,
    error,
    getSedeIdFromConsultorio,
    getSedeIdForInventory,
    getConsultorioName,
    getSedeName
  };
}

