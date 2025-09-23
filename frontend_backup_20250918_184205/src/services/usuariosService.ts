import api from './api';

const USUARIOS_URL = '/usuarios';

export async function getUsuarios(rol?: string) {
  const params = rol ? { rol } : {};
  const res = await api.get(USUARIOS_URL, { params });
  return res.data;
}

export async function crearUsuario(usuario: {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  consultorio_id: string;
}) {
  const res = await api.post(USUARIOS_URL, usuario);
  return res.data;
}

export async function actualizarUsuario(id: string, usuario: {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  consultorio_id: string;
}) {
  const res = await api.put(`${USUARIOS_URL}/${id}`, usuario);
  return res.data;
}

export async function eliminarUsuario(id: string) {
  const res = await api.delete(`${USUARIOS_URL}/${id}`);
  return res.data;
} 