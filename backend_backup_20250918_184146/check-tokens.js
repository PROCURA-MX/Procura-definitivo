const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        googleCalendarId: true
      }
    });
    
    console.log('🔍 TODOS LOS USUARIOS Y SUS TOKENS:');
    users.forEach(user => {
      console.log({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        hasAccessToken: !!user.googleAccessToken,
        hasRefreshToken: !!user.googleRefreshToken,
        tokenExpiry: user.googleTokenExpiry,
        calendarId: user.googleCalendarId
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
