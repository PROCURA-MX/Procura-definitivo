import axios from 'axios';

// Interceptor para agregar token a todas las peticiones
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor global para manejar expiración de sesión o token inválido
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Solo limpiar token si es un error de autenticación real, no de middleware
      if (error.response.data?.error?.includes('autenticado') || 
          error.response.data?.error?.includes('token')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.reload()
      }
    }
    return Promise.reject(error)
  }
)

const API_URL = '/api/servicios';

export interface Servicio {
  id: string;
  nombre: string;
  precio_base: number;
  descripcion?: string | null;
  clave_sat?: string | null;
  clave_unidad?: string | null;
}

export async function getAllServicios(): Promise<Servicio[]> {
  const res = await axios.get(API_URL);
  return res.data;
}

export async function createServicio(data: Omit<Servicio, 'id'>): Promise<Servicio> {
  const res = await axios.post(API_URL, data);
  return res.data;
}

export async function updateServicio(id: string, data: Omit<Servicio, 'id'>): Promise<Servicio> {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
}

export async function deleteServicio(id: string): Promise<void> {
  await axios.delete(`${API_URL}/${id}`);
}

export async function getUsosDeServicio(id: string) {
  const res = await axios.get(`/api/servicios/${id}/usos`);
  return res.data;
} 