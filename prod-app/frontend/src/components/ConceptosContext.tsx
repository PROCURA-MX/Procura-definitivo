import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as api from "@/services/conceptosService";

export type Servicio = api.Servicio;

type ConceptosContextType = {
  servicios: Servicio[];
  loading: boolean;
  error: string | null;
  addServicio: (s: Omit<Servicio, "id">) => Promise<void>;
  editServicio: (id: string, s: Omit<Servicio, "id">) => Promise<void>;
  deleteServicio: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const ConceptosContext = createContext<ConceptosContextType | undefined>(undefined);

export function ConceptosProvider({ children }: { children: ReactNode }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServicios = async () => {
    if (loading) return; // Evitar múltiples llamadas simultáneas
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllServicios();
      setServicios(data);
    } catch (err: any) {
      console.error('Error loading servicios:', err);
      setError("Error al cargar servicios");
      setServicios([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo cargar si no hay servicios y no está cargando
    if (servicios.length === 0 && !loading) {
      loadServicios();
    }
  }, []); // Dependencias vacías para que solo se ejecute una vez

  const addServicio = async (s: Omit<Servicio, "id">) => {
    setError(null);
    try {
      const nuevo = await api.createServicio(s);
      setServicios((prev) => [...prev, nuevo]);
    } catch (err: any) {
      setError("Error al agregar servicio");
    }
  };

  const editServicio = async (id: string, s: Omit<Servicio, "id">) => {
    setError(null);
    try {
      const actualizado = await api.updateServicio(id, s);
      setServicios((prev) => prev.map(serv => (serv.id === id ? actualizado : serv)));
    } catch (err: any) {
      setError("Error al editar servicio");
    }
  };

  const deleteServicio = async (id: string) => {
    setError(null);
    try {
      await api.deleteServicio(id);
      setServicios((prev) => prev.filter(serv => serv.id !== id));
    } catch (err: any) {
      setError("Error al eliminar servicio");
    }
  };

  const reload = loadServicios;

  return (
    <ConceptosContext.Provider value={{ servicios, loading, error, addServicio, editServicio, deleteServicio, reload }}>
      {children}
    </ConceptosContext.Provider>
  );
}

export function useConceptos() {
  const ctx = useContext(ConceptosContext);
  if (!ctx) throw new Error("useConceptos debe usarse dentro de ConceptosProvider");
  return ctx;
} 