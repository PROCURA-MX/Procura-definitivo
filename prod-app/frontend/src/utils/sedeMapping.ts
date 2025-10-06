/**
 * Utilidad para mapear la organización del usuario al sedeId correspondiente
 * Esto es crucial para el funcionamiento del multi-tenant en inventario
 */

interface User {
  id: string;
  email: string;
  organizacion_id: string;
  sedeId?: string;
}

/**
 * Mapea la organización del usuario al sedeId correspondiente
 * @param user - Usuario autenticado
 * @returns sedeId correspondiente a la organización del usuario
 */
export function getSedeIdForUser(user: User): string {
  // Si el usuario ya tiene un sedeId asignado, usarlo
  if (user.sedeId) {
    return user.sedeId;
  }

  // Mapear por organizacion_id
  switch (user.organizacion_id) {
    case '03ea7973-906d-4fb6-bcfa-d8019628998e': // Organización por Defecto
      return 'sede-organizacion-default';
    case '445676da-053b-4329-9f70-d2e3e4d594b1': // Clínica García
      return 'sede-clinica-garcia';
    default:
      // Fallback para organizaciones no mapeadas
      console.warn(`⚠️ Organización no mapeada: ${user.organizacion_id}, usando sede por defecto`);
      return 'sede-organizacion-default';
  }
}

/**
 * Obtiene el sedeId del usuario autenticado desde localStorage
 * @returns sedeId correspondiente o sede por defecto si no hay usuario autenticado
 */
export function getCurrentUserSedeId(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token || !user.id) {
      console.warn('⚠️ No hay token o usuario autenticado, usando sede por defecto');
      return 'sede-organizacion-default';
    }

    // Extraer organizacion_id del token JWT
    const payload = JSON.parse(atob(token.split('.')[1]));
    const organizacion_id = payload.organizacion_id;

    if (!organizacion_id) {
      console.warn('⚠️ No se encontró organizacion_id en el token, usando sede por defecto');
      return 'sede-organizacion-default';
    }

    // Crear objeto usuario con organizacion_id
    const userWithOrg = {
      ...user,
      organizacion_id
    };

    const sedeId = getSedeIdForUser(userWithOrg);
    console.log('🔍 Usuario:', user.email, 'Organización:', organizacion_id, 'SedeId:', sedeId);
    return sedeId;
  } catch (error) {
    console.error('❌ Error obteniendo sedeId del usuario:', error);
    return 'sede-organizacion-default';
  }
}

/**
 * Obtiene información de la organización del usuario actual
 * @returns Información de la organización o null si no hay usuario autenticado
 */
export function getCurrentUserOrganization(): { id: string; name: string; sedeId: string } | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token || !user.id) {
      return null;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const organizacion_id = payload.organizacion_id;

    if (!organizacion_id) {
      return null;
    }

    const sedeId = getSedeIdForUser({ ...user, organizacion_id });

    // Mapear nombres de organización
    let organizationName = 'Organización Desconocida';
    switch (organizacion_id) {
      case '03ea7973-906d-4fb6-bcfa-d8019628998e':
        organizationName = 'Organización por Defecto';
        break;
      case '445676da-053b-4329-9f70-d2e3e4d594b1':
        organizationName = 'Clínica García';
        break;
    }

    return {
      id: organizacion_id,
      name: organizationName,
      sedeId
    };
  } catch (error) {
    console.error('❌ Error obteniendo información de organización:', error);
    return null;
  }
}

/**
 * Verifica si el usuario actual tiene acceso a un sedeId específico
 * @param sedeId - sedeId a verificar
 * @returns true si el usuario tiene acceso, false en caso contrario
 */
export function hasAccessToSede(sedeId: string): boolean {
  const userSedeId = getCurrentUserSedeId();
  return userSedeId === sedeId;
}

/**
 * Obtiene todos los sedeIds disponibles para el usuario actual
 * @returns Array de sedeIds a los que el usuario tiene acceso
 */
export function getAvailableSedes(): string[] {
  const userSedeId = getCurrentUserSedeId();
  return userSedeId ? [userSedeId] : [];
}
