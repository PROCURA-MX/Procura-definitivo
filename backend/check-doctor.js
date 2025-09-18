const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoctor() {
  try {
    const doctor = await prisma.usuario.findUnique({
      where: { email: 'doctor@clinica.com' },
      select: {
        id: true,
        email: true,
        consultorio_id: true,
        organizacion_id: true,
        rol: true
      }
    });
    
    console.log('Doctor data:', doctor);
    
    if (doctor && doctor.consultorio_id) {
      console.log('✅ Doctor has consultorio_id:', doctor.consultorio_id);
    } else {
      console.log('❌ Doctor has NO consultorio_id');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoctor();

























