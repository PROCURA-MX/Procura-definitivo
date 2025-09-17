const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkServiciosSchema() {
  try {
    console.log('🔍 Verificando estructura de la tabla servicios...\n');

    // Obtener información de la tabla
    const tableInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'servicios' 
      ORDER BY ordinal_position
    `;

    console.log('📋 Estructura de la tabla servicios:');
    tableInfo.forEach((column, index) => {
      console.log(`${index + 1}. ${column.column_name}:`);
      console.log(`   - Tipo: ${column.data_type}`);
      console.log(`   - Nullable: ${column.is_nullable}`);
      console.log(`   - Default: ${column.column_default || 'N/A'}`);
      console.log('');
    });

    // Verificar restricciones
    console.log('🔒 Restricciones de la tabla:');
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'servicios'
      ORDER BY tc.constraint_type, kcu.column_name
    `;

    constraints.forEach((constraint, index) => {
      console.log(`${index + 1}. ${constraint.constraint_type}: ${constraint.constraint_name} (${constraint.column_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiciosSchema(); 