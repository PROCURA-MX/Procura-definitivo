import axios from 'axios';

// Interceptor global para manejar expiración de sesión o token inválido
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

const API_BASE_URL = '/api';
const PACIENTES_URL = `${API_BASE_URL}/pacientes`;

export async function getPacientes() {
  const res = await axios.get(PACIENTES_URL);
  return res.data;
}

export async function crearPaciente(paciente: {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
}) {
  const res = await axios.post(PACIENTES_URL, paciente);
  return res.data;
}

export async function actualizarPaciente(id: string, paciente: {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
}) {
  const res = await axios.put(`${PACIENTES_URL}/${id}`, paciente);
  return res.data;
}

export async function eliminarPaciente(id: string) {
  const res = await axios.delete(`${PACIENTES_URL}/${id}`);
  return res.data;
}

export async function borrarPaciente(id: string) {
  const res = await axios.delete(`${PACIENTES_URL}/${id}`);
  return res.data;
} 