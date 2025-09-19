import axios from 'axios'

const API_BASE_URL = '/api'
const BLOQUEO_URL = `${API_BASE_URL}/bloqueo-medico`

export async function getBloqueos(usuario_id?: string) {
  const res = await axios.get(BLOQUEO_URL, { params: usuario_id ? { usuario_id } : {} })
  return res.data
}

export async function crearBloqueo(data: {
  usuario_id: string
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}) {
  const res = await axios.post(BLOQUEO_URL, data)
  return res.data
}

export async function actualizarBloqueo(id: string, data: {
  fecha_inicio: string
  fecha_fin: string
  motivo?: string
}) {
  const res = await axios.put(`${BLOQUEO_URL}/${id}`, data)
  return res.data
}

export async function eliminarBloqueo(id: string) {
  const res = await axios.delete(`${BLOQUEO_URL}/${id}`)
  return res.data
} 