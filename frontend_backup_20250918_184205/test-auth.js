// Script para verificar el estado de autenticación
console.log('🔍 Verificando estado de autenticación...');

// Verificar si hay token en localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('🔑 Token presente:', !!token);
console.log('👤 Usuario presente:', !!user);

if (token) {
  try {
    // Decodificar el token para ver su contenido
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('📋 Payload del token:', payload);
    
    // Verificar si el token ha expirado
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const isExpired = now > exp;
    
    console.log('⏰ Token expirado:', isExpired);
    console.log('🕐 Tiempo actual:', new Date(now * 1000));
    console.log('🕐 Expiración:', new Date(exp * 1000));
    
  } catch (error) {
    console.log('❌ Error decodificando token:', error.message);
  }
} else {
  console.log('❌ No hay token en localStorage');
}

// Verificar si el usuario está logueado
if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('👤 Datos del usuario:', userData);
  } catch (error) {
    console.log('❌ Error parseando datos del usuario:', error.message);
  }
}

