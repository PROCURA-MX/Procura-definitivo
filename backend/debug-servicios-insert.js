const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugServiciosInsert() {
  try {
    console.log('🔍 Debuggeando inserción de servicios...\n');

    // Obtener el orden exacto de las columnas
    const columns = await prisma.$queryRaw`
      SELECT column_name, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'servicios' 
      ORDER BY ordinal_position
    `;

    console.log('📋 Orden de columnas en la tabla servicios:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (posición: ${col.ordinal_position})`);
    });
    console.log('');

    // Intentar una inserción manual para ver exactamente qué falla
    console.log('🧪 Intentando inserción manual...');
    
    const organizacionId = '03ea7973-906d-4fb6-bcfa-d8019628998e';
    const nombre = 'Test Servicio';
    const precioBase = 100.00;

    try {
      const result = await prisma.$queryRaw`
        INSERT INTO servicios (id, nombre, descripcion, precio_base, created_at, updated_at, organizacion_id)
        VALUES (gen_random_uuid(), ${nombre}, NULL, ${precioBase}, NOW(), NOW(), ${organizacionId}::uuid)
        RETURNING *
      `;
      console.log('✅ Inserción exitosa:', result);
    } catch (error) {
      console.log('❌ Error en inserción:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugServiciosInsert(); 