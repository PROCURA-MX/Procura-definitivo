const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGoogleStatus() {
  try {
    console.log('🔍 Debuggeando estado de Google Calendar...\n');

    // Buscar usuario con Google Calendar configurado
    const usuario = await prisma.usuario.findFirst({
      where: {
        googleRefreshToken: { not: null }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleCalendarId: true
      }
    });

    if (!usuario) {
      console.log('❌ No se encontró ningún usuario con Google Calendar configurado');
      return;
    }

    console.log('Usuario encontrado:', usuario.nombre, usuario.apellido);
    console.log('Email:', usuario.email);
    console.log('Google Access Token:', usuario.googleAccessToken ? 'Presente' : 'Ausente');
    console.log('Google Refresh Token:', usuario.googleRefreshToken ? 'Presente' : 'Ausente');
    console.log('Google Calendar ID:', usuario.googleCalendarId || 'No configurado');
    console.log('Token expira:', usuario.googleTokenExpiry);
    console.log('');

    // Verificar si el token ha expirado
    const now = new Date();
    const isExpired = usuario.googleTokenExpiry && now > usuario.googleTokenExpiry;
    console.log('Token expirado:', isExpired ? 'SÍ' : 'NO');
    console.log('Hora actual:', now.toISOString());
    console.log('Hora de expiración:', usuario.googleTokenExpiry?.toISOString());
    console.log('');

    // Verificar si debería estar conectado
    const shouldBeConnected = usuario.googleAccessToken && usuario.googleRefreshToken;
    console.log('Debería estar conectado:', shouldBeConnected ? 'SÍ' : 'NO');
    console.log('');

    if (shouldBeConnected) {
      console.log('✅ El usuario debería estar conectado a Google Calendar');
      console.log('El problema puede estar en el endpoint /api/google/status');
    } else {
      console.log('❌ El usuario no tiene todos los tokens necesarios');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugGoogleStatus(); 