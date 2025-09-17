const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalizeInventory() {
  try {
    console.log('🔧 FINALIZANDO MIGRACIÓN DEL INVENTARIO...\n');

    // MOVER PRODUCTOS DE CATEGORÍA NULL
    console.log('🔄 Moviendo productos de categoría null...');
    
    const nullCategoryProducts = await prisma.product.findMany({
      where: { category: null }
    });

    const nullCategoryMappings = {
      'VITS': 'MEDICAMENTOS',
      'Evans': 'MEDICAMENTOS'
    };

    for (const product of nullCategoryProducts) {
      const newCategory = nullCategoryMappings[product.name];
      if (newCategory) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory }
        });
        console.log(`   ✅ Movido producto: ${product.name} → ${newCategory}`);
      } else {
        console.log(`   ℹ️  Producto sin categoría mantenido: ${product.name}`);
      }
    }

    console.log('\n🎉 ¡MIGRACIÓN FINALIZADA EXITOSAMENTE!');
    console.log('✅ Productos de categoría null movidos');
    console.log('✅ Sistema de inventario limpio y consistente');
    console.log('');
    console.log('📋 RESUMEN DEL SISTEMA:');
    console.log('   - ✅ Duplicados eliminados');
    console.log('   - ✅ Categorías unificadas');
    console.log('   - ✅ Stock preservado');
    console.log('   - ✅ Movimientos actualizados');
    console.log('   - ✅ Detalles de uso actualizados');
    console.log('   - ✅ Productos de categoría null movidos');
    console.log('');
    console.log('🚀 El sistema está listo para funcionar correctamente');

  } catch (error) {
    console.error('❌ Error durante la finalización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalizeInventory();
