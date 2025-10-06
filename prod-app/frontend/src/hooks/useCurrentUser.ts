import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        
        // Obtener usuario real desde localStorage
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userData || !token) {
          setError('No hay usuario autenticado');
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        // Extraer información adicional del token JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const currentUser = {
          id: parsedUser.id,
          nombre: parsedUser.nombre,
          apellido: parsedUser.apellido,
          email: parsedUser.email,
          rol: parsedUser.rol,
          consultorio_id: parsedUser.consultorio_id,
          organizacion_id: payload.organizacion_id,
          ...parsedUser
        };
        
        console.log('🔄 Usuario actual cargado:', currentUser);
        setUser(currentUser);
      } catch (err) {
        console.error('❌ Error obteniendo usuario actual:', err);
        setError(err instanceof Error ? err.message : 'Error al obtener usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return {
    currentUser: user,
    loading,
    error,
    isAuthenticated: !!user
  };
}