const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSecretaries() {
  console.log('👩‍💼 Creando secretarias para los consultorios...');
  
  try {
    // Obtener todos los consultorios
    const consultorios = await prisma.$queryRaw`
      SELECT c.id, c.nombre, o.nombre as organizacion_nombre
      FROM consultorios c
      JOIN organizaciones o ON c.organizacion_id = o.id
      ORDER BY o.nombre, c.nombre
    `;
    
    const secretarias = [
      { nombre: 'María', apellido: 'González', email: 'maria.gonzalez1@clinica.com' },
      { nombre: 'Ana', apellido: 'Rodríguez', email: 'ana.rodriguez1@clinica.com' },
      { nombre: 'Carmen', apellido: 'López', email: 'carmen.lopez1@clinica.com' },
      { nombre: 'Sofia', apellido: 'Martínez', email: 'sofia.martinez1@clinica.com' },
      { nombre: 'Patricia', apellido: 'Hernández', email: 'patricia.hernandez1@clinica.com' }
    ];
    
    for (let i = 0; i < consultorios.length; i++) {
      const consultorio = consultorios[i];
      const secretaria = secretarias[i % secretarias.length];
      
      // Crear secretaria para este consultorio con email único
      const emailUnico = secretaria.email.replace('@', `${i + 1}@`);
      const secretariaCreada = await prisma.$queryRaw`
        INSERT INTO usuarios (id, nombre, apellido, email, telefono, rol, consultorio_id, organizacion_id, updated_at)
        VALUES (
          gen_random_uuid(), 
          ${secretaria.nombre}, 
          ${secretaria.apellido}, 
          ${emailUnico}, 
          '555-000' || ${i + 1}, 
          'SECRETARIA', 
          ${consultorio.id}::text, 
          (SELECT organizacion_id FROM consultorios WHERE id = ${consultorio.id}::text)::uuid, 
          NOW()
        )
        RETURNING id, nombre, apellido, email, rol
      `;
      
      console.log(`✅ Secretaria ${secretaria.nombre} ${secretaria.apellido} creada para ${consultorio.organizacion_nombre} - ${consultorio.nombre}`);
      console.log(`   Email: ${emailUnico}`);
      console.log(`   Password: 123456`);
    }
    
    console.log('\n🎉 ¡Secretarias creadas exitosamente!');
    console.log('Ahora cada consultorio tiene su secretaria.');
    console.log('Los médicos solo verán usuarios de su consultorio específico.');
    
  } catch (error) {
    console.error('❌ Error creando secretarias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSecretaries(); 