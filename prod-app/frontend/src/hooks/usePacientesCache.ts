import { useState, useEffect, useCallback } from 'react';
import { getPacientes } from '@/services/pacientesService';

interface PacientesCache {
  pacientes: any[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

export function usePacientesCache(page: number = 1, pageSize: number = 20, refreshInterval: number = 120000) {
  const [cache, setCache] = useState<PacientesCache>({
    pacientes: [],
    lastUpdated: null,
    isLoading: false,
    error: null
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadPacientes = useCallback(async () => {
    setCache(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await getPacientes(page, pageSize);
      setCache({
        pacientes: data.pacientes || data,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error al cargar pacientes'
      }));
    }
  }, [page, pageSize]);

  // Cargar datos iniciales
  useEffect(() => {
    loadPacientes();
  }, [loadPacientes, refreshTrigger]);

  // Auto-refresh cada cierto tiempo
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Función para forzar actualización
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Función para invalidar cache (útil después de crear/editar/eliminar)
  const invalidateCache = useCallback(() => {
    setCache(prev => ({ ...prev, lastUpdated: null }));
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    ...cache,
    refresh,
    invalidateCache,
    isStale: cache.lastUpdated ? (Date.now() - cache.lastUpdated.getTime()) > refreshInterval : true
  };
}
