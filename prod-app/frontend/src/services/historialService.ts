const HISTORIAL_URL = '/api/historial';

export interface HistorialItem {
  id: string;
  created_at: string;
  tipo_cambio: 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ACTUALIZACION';
  detalles_antes: any;
  detalles_despues: any;
  usuario_id: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  // Fields specific to Cobros
  cobro_id?: string;
  cobro?: {
    id: string;
    monto_total: number;
    fecha_cobro: string;
    created_at: string;
    paciente?: {
      nombre: string;
      apellido: string;
    };
  };
  // Fields specific to Inventario
  movement_id?: string;
  product_id?: string;
  // Fields specific to Calendario
  cita_id?: string;
  cita?: {
    id: string;
    fecha_inicio: string;
    fecha_fin: string;
    paciente?: {
      nombre: string;
      apellido: string;
    };
    consultorio?: {
      nombre: string;
    };
  };
  // Fields specific to Usuarios
  target_user_id?: string;
  modulo?: 'cobros' | 'inventario' | 'calendario' | 'usuarios';
  metadata?: {
    paciente_id?: string;
    paciente_nombre?: string;
    producto_id?: string;
    producto_nombre?: string;
    cita_id?: string;
    cita_fecha?: string;
    consultorio_id?: string;
    consultorio_nombre?: string;
    monto?: number;
    metodo_pago?: string;
    cantidad?: number;
    tipo_movimiento?: 'ENTRADA' | 'SALIDA';
    estado_anterior?: string;
    estado_nuevo?: string;
    permisos_cambiados?: string[];
    motivo_cambio?: string;
    usuario_nombre?: string;
    usuario_rol?: string;
  };
}

export async function getHistorialGeneral(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
  modulo?: string;
  limit?: number;
  offset?: number;
}) {
  console.log('🔍 DEBUG - getHistorialGeneral llamado con filtros:', filtros);
  
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);
  if (filtros?.modulo) params.append('modulo', filtros.modulo);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const url = `${HISTORIAL_URL}/general?${params}`;
  console.log('🔍 DEBUG - URL de la petición:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('🔍 DEBUG - Status de la respuesta:', response.status);

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 503) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'La base de datos no está disponible en este momento');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial');
  }

  const responseData = await response.json();
  console.log('🔍 DEBUG - Datos recibidos del backend:', responseData);
  
  // Verificar que la respuesta tenga la estructura esperada
  if (!responseData.success || !Array.isArray(responseData.data)) {
    console.error('❌ ERROR - Estructura de respuesta inválida:', responseData);
    throw new Error('Formato de respuesta inválido del servidor');
  }
  
  console.log('🔍 DEBUG - Cantidad de registros recibidos:', responseData.data.length);
  console.log('🔍 DEBUG - Primer item del backend:', responseData.data[0]);
  
  // Mapear y transformar los datos para que coincidan con la interfaz esperada
  const historialMapeado = responseData.data.map((item: any) => ({
    id: item.id,
    created_at: item.created_at || item.fecha, // Usar created_at si existe, sino fecha
    tipo_cambio: item.accion || item.tipo_cambio, // Usar accion si existe, sino tipo_cambio
    accion: item.accion || item.tipo_cambio, // Para compatibilidad
    modulo: item.modulo || 'cobros',
    tipo: item.tipo, // Nuevo campo para tipo de historial
    descripcion: item.descripcion, // Nueva descripción del backend
    detalles: {
      cobro_id: item.detalles?.cobro_id,
      producto_id: item.detalles?.producto_id,
      producto_nombre: item.detalles?.producto_nombre,
      cantidad: item.detalles?.cantidad,
      tipo: item.detalles?.tipo,
      paciente_id: item.detalles?.paciente_id,
      paciente_nombre: item.detalles?.paciente_nombre,
      fecha_cita: item.detalles?.fecha_cita,
      usuario_id: item.detalles?.usuario_id,
      email: item.detalles?.email,
      rol: item.detalles?.rol
    },
    detalles_antes: item.detalles_antes,
    detalles_despues: item.detalles_despues,
    usuario: item.usuario,
    usuario_id: item.usuario_id
  }));
  
  console.log('🔍 DEBUG - Primer item mapeado:', historialMapeado[0]);
  console.log('🔍 DEBUG - Cantidad de items mapeados:', historialMapeado.length);
  
  return historialMapeado;
}

export async function getHistorialEstadisticas() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/estadisticas`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar las estadísticas');
  }

  return response.json();
}

export async function buscarHistorial(termino: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/buscar?q=${encodeURIComponent(termino)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al buscar en el historial');
  }

  return response.json();
}

// Nuevas funciones para los diferentes módulos
export async function getHistorialInventario(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
  limit?: number;
  offset?: number;
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const response = await fetch(`${HISTORIAL_URL}/inventario?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial de inventario');
  }

  const responseData = await response.json();
  
  // Verificar que la respuesta tenga la estructura esperada
  if (!responseData.success || !Array.isArray(responseData.data)) {
    console.error('❌ ERROR - Estructura de respuesta inválida para inventario:', responseData);
    throw new Error('Formato de respuesta inválido del servidor');
  }
  
  // Mapear y transformar los datos para que coincidan con la interfaz esperada
  const historialMapeado = responseData.data.map((item: any) => ({
    id: item.id,
    created_at: item.created_at || item.fecha, // Usar created_at si existe, sino fecha
    tipo_cambio: item.accion || item.tipo_cambio, // Usar accion si existe, sino tipo_cambio
    accion: item.accion || item.tipo_cambio, // Para compatibilidad
    modulo: 'inventario',
    tipo: item.tipo, // Nuevo campo para tipo de historial
    descripcion: item.descripcion, // Nueva descripción del backend
    detalles: {
      cobro_id: item.detalles?.cobro_id,
      producto_id: item.detalles?.producto_id,
      producto_nombre: item.detalles?.producto_nombre,
      cantidad: item.detalles?.cantidad,
      tipo: item.detalles?.tipo,
      paciente_id: item.detalles?.paciente_id,
      paciente_nombre: item.detalles?.paciente_nombre,
      fecha_cita: item.detalles?.fecha_cita,
      usuario_id: item.detalles?.usuario_id,
      email: item.detalles?.email,
      rol: item.detalles?.rol,
      costo_unitario: item.detalles?.costo_unitario,
      costo_total: item.detalles?.costo_total
    },
    detalles_antes: item.detalles_antes,
    detalles_despues: item.detalles_despues,
    usuario: item.usuario,
    usuario_id: item.usuario_id
  }));
  
  return historialMapeado;
}

export async function getHistorialCalendario(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
  limit?: number;
  offset?: number;
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const response = await fetch(`${HISTORIAL_URL}/calendario?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial de calendario');
  }

  const responseData = await response.json();
  
  // Verificar que la respuesta tenga la estructura esperada
  if (!responseData.success || !Array.isArray(responseData.data)) {
    console.error('❌ ERROR - Estructura de respuesta inválida para calendario:', responseData);
    throw new Error('Formato de respuesta inválido del servidor');
  }
  
  // Mapear y transformar los datos para que coincidan con la interfaz esperada
  const historialMapeado = responseData.data.map((item: any) => ({
    id: item.id,
    created_at: item.created_at || item.fecha, // Usar created_at si existe, sino fecha
    tipo_cambio: item.accion || item.tipo_cambio, // Usar accion si existe, sino tipo_cambio
    accion: item.accion || item.tipo_cambio, // Para compatibilidad
    modulo: 'calendario',
    tipo: item.tipo, // Nuevo campo para tipo de historial
    descripcion: item.descripcion, // Nueva descripción del backend
    detalles: {
      cobro_id: item.detalles?.cobro_id,
      producto_id: item.detalles?.producto_id,
      producto_nombre: item.detalles?.producto_nombre,
      cantidad: item.detalles?.cantidad,
      tipo: item.detalles?.tipo,
      paciente_id: item.detalles?.paciente_id,
      paciente_nombre: item.detalles?.paciente_nombre,
      fecha_cita: item.detalles?.fecha_cita,
      usuario_id: item.detalles?.usuario_id,
      email: item.detalles?.email,
      rol: item.detalles?.rol,
      titulo: item.detalles?.titulo,
      estado: item.detalles?.estado,
      consultorio_id: item.detalles?.consultorio_id
    },
    detalles_antes: item.detalles_antes,
    detalles_despues: item.detalles_despues,
    usuario: item.usuario,
    usuario_id: item.usuario_id
  }));
  
  return historialMapeado;
}

export async function getHistorialUsuarios(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
  limit?: number;
  offset?: number;
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);
  if (filtros?.limit) params.append('limit', filtros.limit.toString());
  if (filtros?.offset) params.append('offset', filtros.offset.toString());

  const response = await fetch(`${HISTORIAL_URL}/usuarios?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial de usuarios');
  }

  const responseData = await response.json();
  
  // Verificar que la respuesta tenga la estructura esperada
  if (!responseData.success || !Array.isArray(responseData.data)) {
    console.error('❌ ERROR - Estructura de respuesta inválida para usuarios:', responseData);
    throw new Error('Formato de respuesta inválido del servidor');
  }
  
  // Mapear y transformar los datos para que coincidan con la interfaz esperada
  const historialMapeado = responseData.data.map((item: any) => ({
    id: item.id,
    created_at: item.created_at || item.fecha, // Usar created_at si existe, sino fecha
    tipo_cambio: item.accion || item.tipo_cambio, // Usar accion si existe, sino tipo_cambio
    accion: item.accion || item.tipo_cambio, // Para compatibilidad
    modulo: 'usuarios',
    tipo: item.tipo, // Nuevo campo para tipo de historial
    descripcion: item.descripcion, // Nueva descripción del backend
    detalles: {
      cobro_id: item.detalles?.cobro_id,
      producto_id: item.detalles?.producto_id,
      producto_nombre: item.detalles?.producto_nombre,
      cantidad: item.detalles?.cantidad,
      tipo: item.detalles?.tipo,
      paciente_id: item.detalles?.paciente_id,
      paciente_nombre: item.detalles?.paciente_nombre,
      fecha_cita: item.detalles?.fecha_cita,
      usuario_id: item.detalles?.usuario_id,
      email: item.detalles?.email,
      rol: item.detalles?.rol,
      fecha_creacion: item.detalles?.fecha_creacion,
      fecha_actualizacion: item.detalles?.fecha_actualizacion
    },
    detalles_antes: item.detalles_antes,
    detalles_despues: item.detalles_despues,
    usuario: item.usuario,
    usuario_id: item.usuario_id
  }));
  
  return historialMapeado;
}

export async function exportarHistorial(formato: 'json' | 'csv', filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  tipoCambio?: string;
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const params = new URLSearchParams();
  params.append('formato', formato);
  
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros?.tipoCambio) params.append('tipoCambio', filtros.tipoCambio);

  const response = await fetch(`${HISTORIAL_URL}/exportar?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al exportar el historial');
  }

  return response;
}

export async function getHistorialCobro(cobroId: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
  }

  const response = await fetch(`${HISTORIAL_URL}/cobro/${cobroId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    throw new Error('Error al cargar el historial del cobro');
  }

  return response.json();
}

