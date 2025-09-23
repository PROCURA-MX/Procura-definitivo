const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanExpiredTokens() {
  try {
    console.log('🧹 Limpiando tokens expirados de Google Calendar...\n');

    // Buscar usuarios con tokens de Google
    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [
          { googleAccessToken: { not: null } },
          { googleRefreshToken: { not: null } }
        ]
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

    if (usuarios.length === 0) {
      console.log('✅ No se encontraron usuarios con tokens de Google');
      return;
    }

    console.log(`📋 Encontrados ${usuarios.length} usuarios con tokens de Google:\n`);

    for (const usuario of usuarios) {
      console.log(`👤 ${usuario.nombre} ${usuario.apellido} (${usuario.email})`);
      console.log(`   Access Token: ${usuario.googleAccessToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   Refresh Token: ${usuario.googleRefreshToken ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   Expira: ${usuario.googleTokenExpiry || 'No configurado'}`);
      
      // Verificar si está expirado
      const now = new Date();
      const isExpired = usuario.googleTokenExpiry && now > usuario.googleTokenExpiry;
      console.log(`   Estado: ${isExpired ? '❌ Expirado' : '✅ Válido'}`);
      console.log('');

      // Limpiar tokens expirados o inválidos
      if (isExpired || !usuario.googleRefreshToken) {
        console.log(`   🧹 Limpiando tokens...`);
        
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiry: null,
            googleCalendarId: null
          }
        });
        
        console.log(`   ✅ Tokens limpiados para ${usuario.nombre} ${usuario.apellido}`);
      } else {
        console.log(`   ✅ Tokens válidos, manteniendo para ${usuario.nombre} ${usuario.apellido}`);
      }
      console.log('');
    }

    console.log('🎉 Proceso de limpieza completado');
    console.log('');
    console.log('💡 Ahora los usuarios pueden reconectar con Google Calendar desde la interfaz.');

  } catch (error) {
    console.error('❌ Error limpiando tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
cleanExpiredTokens();
