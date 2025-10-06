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

const COBROS_URL = '/api/cobros';
const CONCEPTOS_URL = '/api/cobro-conceptos';
const PACIENTES_URL = '/api/pacientes';
const USUARIOS_URL = '/api/usuarios';
const CONSULTORIOS_URL = '/api/consultorios';

export async function crearCobro(data: any) {
  const token = localStorage.getItem('token');
  const res = await axios.post(COBROS_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function agregarConceptoACobro(data: any) {
  const token = localStorage.getItem('token');
  const res = await axios.post(CONCEPTOS_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getPacientes() {
  const token = localStorage.getItem('token');
  const res = await axios.get(PACIENTES_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getUsuarios() {
  const token = localStorage.getItem('token');
  const res = await axios.get(USUARIOS_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getConsultorios() {
  const token = localStorage.getItem('token');
  const res = await axios.get(CONSULTORIOS_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getConsultoriosUsuario() {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${CONSULTORIOS_URL}/usuario`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getCobros(consultorioId?: string | null) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  
  console.log('🔍 getCobros llamado con consultorioId:', consultorioId);
  
  if (consultorioId && consultorioId !== 'todos') {
    params.append('consultorio_id', consultorioId);
    console.log('🔍 Agregando filtro consultorio_id:', consultorioId);
  } else if (consultorioId === 'todos') {
    // Agregar parámetro 'todos' para mostrar todos los consultorios
    params.append('consultorio_id', 'todos');
    console.log('🔍 Mostrando todos los consultorios');
  } else {
    console.log('🔍 Sin filtro de consultorio');
  }
  
  const url = `${COBROS_URL}?${params.toString()}`;
  console.log('🔍 URL de la petición:', url);
  
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  console.log('🔍 Respuesta recibida:', res.data.length, 'cobros');
  return res.data;
}

export async function eliminarCobro(id: string) {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${COBROS_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function editarCobro(id: string, data: any) {
  const token = localStorage.getItem('token');
  const res = await axios.put(`${COBROS_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
} 