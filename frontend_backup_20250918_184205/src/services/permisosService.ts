import axios from 'axios';

const API_URL = '/api/permisos';

// Interfaces
export interface PermisosUsuario {
  puede_editar_cobros: boolean;
  puede_eliminar_cobros: boolean;
  puede_ver_historial: boolean;
  puede_gestionar_usuarios: boolean;
  puede_gestionar_calendario: boolean;
  puede_gestionar_inventario: boolean;
  puede_ver_facturas: boolean;
  puede_crear_facturas: boolean;
}

export interface ConfiguracionPermisosConsultorio {
  secretaria_editar_cobros: boolean;
  secretaria_eliminar_cobros: boolean;
  enfermera_entradas_inventario: boolean;
  enfermera_salidas_inventario: boolean;
  secretaria_entradas_inventario: boolean;
  secretaria_salidas_inventario: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  puede_editar_cobros: boolean;
  puede_eliminar_cobros: boolean;
  puede_ver_historial: boolean;
  puede_gestionar_usuarios: boolean;
  puede_gestionar_calendario: boolean;
  puede_gestionar_inventario: boolean;
  puede_ver_facturas: boolean;
  puede_crear_facturas: boolean;
  created_at: string;
}

export interface PermisosResponse {
  permisos: PermisosUsuario;
  modulosDisponibles: string[];
  rol: string;
  organizacion?: any;
}

// Función para obtener el token de autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
};

// Obtener permisos del usuario actual
export const obtenerMisPermisos = async (): Promise<PermisosResponse> => {
  try {
    const response = await axios.get(`${API_URL}/mis-permisos`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo permisos:', error);
    throw new Error(error.response?.data?.error || 'Error obteniendo permisos');
  }
};

// Verificar si el usuario tiene un permiso específico
export const verificarPermiso = async (permiso: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/verificar/${permiso}`, {
      headers: getAuthHeaders()
    });
    return response.data.tienePermiso;
  } catch (error: any) {
    console.error('Error verificando permiso:', error);
    return false;
  }
};

// Obtener todos los usuarios del consultorio (solo doctores)
export const obtenerUsuariosConsultorio = async (): Promise<Usuario[]> => {
  try {
    const response = await axios.get(`${API_URL}/usuarios?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    throw new Error(error.response?.data?.error || 'Error obteniendo usuarios');
  }
};

// Crear nuevo usuario (solo doctores)
export const crearUsuario = async (usuarioData: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  password: string;
  consultorio_id?: string;
}): Promise<{ message: string; usuario: Usuario }> => {
  try {
    const response = await axios.post(`${API_URL}/usuarios`, usuarioData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    throw new Error(error.response?.data?.error || 'Error creando usuario');
  }
};

// Actualizar usuario (solo doctores)
export const actualizarUsuario = async (
  usuarioId: string,
  usuarioData: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    rol?: string;
  }
): Promise<{ message: string; usuario: Usuario }> => {
  try {
    const response = await axios.put(`${API_URL}/usuarios/${usuarioId}`, usuarioData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    throw new Error(error.response?.data?.error || 'Error actualizando usuario');
  }
};

// Eliminar usuario (solo doctores)
export const eliminarUsuario = async (usuarioId: string): Promise<{ message: string }> => {
  try {
    const response = await axios.delete(`${API_URL}/usuarios/${usuarioId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    throw new Error(error.response?.data?.error || 'Error eliminando usuario');
  }
};

// Actualizar permisos de un usuario (solo doctores)
export const actualizarPermisosUsuario = async (
  usuarioId: string,
  permisos: Partial<PermisosUsuario>
): Promise<{ message: string; permisos: PermisosUsuario }> => {
  try {
    const response = await axios.put(`${API_URL}/usuarios/${usuarioId}/permisos?t=${Date.now()}`, { permisos }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando permisos:', error);
    throw new Error(error.response?.data?.error || 'Error actualizando permisos');
  }
};

// Obtener configuración de permisos del consultorio (solo doctores)
export const obtenerConfiguracionPermisos = async (): Promise<ConfiguracionPermisosConsultorio> => {
  try {
    const response = await axios.get(`${API_URL}/configuracion`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo configuración:', error);
    throw new Error(error.response?.data?.error || 'Error obteniendo configuración');
  }
};

// Actualizar configuración de permisos del consultorio (solo doctores)
export const actualizarConfiguracionPermisos = async (
  configuracion: Partial<ConfiguracionPermisosConsultorio>
): Promise<{ message: string; configuracion: ConfiguracionPermisosConsultorio }> => {
  try {
    const response = await axios.put(`${API_URL}/configuracion`, configuracion, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando configuración:', error);
    throw new Error(error.response?.data?.error || 'Error actualizando configuración');
  }
};

// Utilidades para verificar permisos localmente
export const tienePermiso = (permisos: PermisosUsuario, permiso: keyof PermisosUsuario): boolean => {
  return permisos[permiso] || false;
};

export const puedeAccederAModulo = (modulosDisponibles: string[], modulo: string): boolean => {
  return modulosDisponibles.includes(modulo);
};

// Constantes para roles
export const ROLES = {
  DOCTOR: 'DOCTOR',
  SECRETARIA: 'SECRETARIA',
  ENFERMERA: 'ENFERMERA',
  ADMINISTRADOR: 'ADMINISTRADOR',
  PACIENTE: 'PACIENTE'
} as const;

export type Rol = typeof ROLES[keyof typeof ROLES];

// Constantes para módulos
export const MODULOS = {
  COBROS: 'cobros',
  PACIENTES: 'pacientes',
  CITAS: 'citas',
  INVENTARIO: 'inventario',
  USUARIOS: 'usuarios',
  HISTORIAL: 'historial',
  CONSULTORIOS: 'consultorios',
  CUESTIONARIOS: 'cuestionarios',
  FACTURACION: 'facturacion'
} as const;

export type Modulo = typeof MODULOS[keyof typeof MODULOS]; 
 
 