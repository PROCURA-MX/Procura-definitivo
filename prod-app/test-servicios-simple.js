const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testServiciosSimple() {
  try {
    console.log('🧪 Probando inserción simple de servicios...\n');

    const organizacionId = '03ea7973-906d-4fb6-bcfa-d8019628998e';
    const nombre = 'Consulta General';
    const precioBase = 500.00;

    console.log('Datos a insertar:');
    console.log('- Organización ID:', organizacionId);
    console.log('- Nombre:', nombre);
    console.log('- Precio Base:', precioBase);
    console.log('');

    // Intentar inserción con el mismo formato que el controlador
    console.log('Intentando inserción...');
    const result = await prisma.$queryRaw`
      INSERT INTO servicios (id, nombre, descripcion, precio_base, created_at, updated_at, organizacion_id)
      VALUES (gen_random_uuid(), ${nombre}, NULL, ${precioBase}, NOW(), NOW(), ${organizacionId}::uuid)
      RETURNING *
    `;

    console.log('✅ Inserción exitosa:');
    console.log(JSON.stringify(result[0], null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiciosSimple(); 