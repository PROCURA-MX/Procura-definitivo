const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserTokens() {
  try {
    // Usuario que SÍ tiene tokens
    const userWithTokens = await prisma.usuario.findFirst({
      where: {
        googleAccessToken: { not: null }
      },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleCalendarId: true
      }
    });

    if (!userWithTokens) {
      console.log('❌ No se encontró ningún usuario con tokens');
      return;
    }

    console.log('✅ Usuario con tokens encontrado:', userWithTokens);

    // Usuario actual (Pablo)
    const currentUser = await prisma.usuario.findUnique({
      where: {
        email: 'rodrigoespc03@gmail.com'
      }
    });

    if (!currentUser) {
      console.log('❌ No se encontró el usuario actual');
      return;
    }

    console.log('✅ Usuario actual encontrado:', currentUser.nombre);

    // Copiar tokens al usuario actual
    const updatedUser = await prisma.usuario.update({
      where: {
        id: currentUser.id
      },
      data: {
        googleAccessToken: userWithTokens.googleAccessToken,
        googleRefreshToken: userWithTokens.googleRefreshToken,
        googleTokenExpiry: userWithTokens.googleTokenExpiry,
        googleCalendarId: userWithTokens.googleCalendarId
      }
    });

    console.log('✅ Tokens copiados exitosamente a:', updatedUser.nombre);
    console.log('🔑 Nuevos tokens:', {
      hasAccessToken: !!updatedUser.googleAccessToken,
      hasRefreshToken: !!updatedUser.googleRefreshToken,
      tokenExpiry: updatedUser.googleTokenExpiry,
      calendarId: updatedUser.googleCalendarId
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserTokens();
