const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugServiciosExact() {
  try {
    console.log('🔍 Debuggeando inserción exacta como el controlador...\n');

    // Simular los datos que vienen del request
    const nombre = 'Consulta General';
    const precio_base = 500.00;
    const organizacionId = '03ea7973-906d-4fb6-bcfa-d8019628998e';

    console.log('Datos simulados del request:');
    console.log('- nombre:', nombre);
    console.log('- precio_base:', precio_base);
    console.log('- organizacionId:', organizacionId);
    console.log('');

    // Validar campos requeridos (como hace el controlador)
    if (!nombre || !precio_base) {
      console.log('❌ Error: Faltan campos requeridos');
      return;
    }

    if (!organizacionId) {
      console.log('❌ Error: No se pudo determinar la organización del usuario');
      return;
    }

    console.log('✅ Validaciones pasadas, intentando inserción...');

    // Usar exactamente la misma query que el controlador
    const result = await prisma.$queryRaw`
      INSERT INTO servicios (id, nombre, descripcion, precio_base, created_at, updated_at, organizacion_id)
      VALUES (gen_random_uuid(), ${nombre}, NULL, ${parseFloat(precio_base)}, NOW(), NOW(), ${organizacionId}::uuid)
      RETURNING *
    `;

    console.log('✅ Inserción exitosa:');
    console.log(JSON.stringify(result[0], null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugServiciosExact(); 