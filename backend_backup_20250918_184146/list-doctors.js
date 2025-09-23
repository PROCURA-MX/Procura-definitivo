const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listDoctors() {
  console.log('👨‍⚕️ Médicos disponibles para pruebas:');
  console.log('=====================================');
  
  try {
    const doctors = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.rol,
        o.nombre as organizacion_nombre,
        o.id as organizacion_id,
        c.nombre as consultorio_nombre
      FROM usuarios u
      JOIN organizaciones o ON u.organizacion_id = o.id
      JOIN consultorios c ON u.consultorio_id = c.id
      WHERE u.rol = 'DOCTOR'
      ORDER BY o.nombre, u.nombre
    `;
    
    doctors.forEach((doctor, index) => {
      console.log(`\n${index + 1}. Dr. ${doctor.nombre} ${doctor.apellido}`);
      console.log(`   📧 Email: ${doctor.email}`);
      console.log(`   🔑 Password: 123456`);
      console.log(`   🏥 Organización: ${doctor.organizacion_nombre}`);
      console.log(`   🏢 Consultorio: ${doctor.consultorio_nombre}`);
      console.log(`   🆔 Organización ID: ${doctor.organizacion_id}`);
    });
    
    console.log('\n💡 Para probar el multi-tenancy:');
    console.log('1. Inicia sesión con diferentes médicos');
    console.log('2. Verifica que cada uno solo ve sus datos');
    console.log('3. Crea pacientes, citas, cobros con cada médico');
    console.log('4. Confirma que no pueden ver datos de otros médicos');
    
  } catch (error) {
    console.error('❌ Error listando médicos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listDoctors(); 