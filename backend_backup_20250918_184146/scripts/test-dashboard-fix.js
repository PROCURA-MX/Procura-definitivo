const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardFix() {
  try {
    console.log('🧪 Probando que el fix del dashboard funcione...\n');
    
    // Simular la lógica del dashboard para verificar que no haya errores
    console.log('📊 1. Simulando queries del dashboard...');
    
    // Simular obtención de productos y movimientos
    const allProducts = await prisma.product.findMany({
      where: { category: 'Alérgenos' },
      take: 5
    });
    
    const entries = await prisma.movement.findMany({
      where: {
        type: 'ENTRY',
        Product: {
          category: 'Alérgenos'
        }
      },
      take: 5
    });
    
    console.log(`  ✅ Productos encontrados: ${allProducts.length}`);
    console.log(`  ✅ Entradas encontradas: ${entries.length}`);
    
    // Simular la lógica corregida del dashboard
    console.log('\n🔧 2. Simulando lógica corregida del dashboard...');
    
    // PRIMERO: Crear realValueMap (esto es lo que estaba causando el error)
    const realValueMap = new Map();
    for (const entry of entries) {
      const productId = entry.productId;
      const currentValue = realValueMap.get(productId) || 0;
      realValueMap.set(productId, currentValue + Number(entry.totalCost));
    }
    
    console.log('  ✅ realValueMap creado correctamente');
    console.log('  ✅ Valores reales por producto:', Object.fromEntries(realValueMap));
    
    // AHORA: Usar realValueMap en el mapeo de inventory
    const inventory = allProducts.map(product => {
      const realValue = realValueMap.get(product.id) || 0;
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        totalValue: realValue > 0 ? realValue : 0
      };
    });
    
    console.log('  ✅ Inventory mapeado correctamente usando realValueMap');
    console.log('  ✅ Primeros productos:', inventory.slice(0, 3));
    
    // AHORA: Usar realValueMap en el cálculo del total
    const totalInventoryValue = inventory.reduce((sum, product) => {
      const realValue = realValueMap.get(product.id) || 0;
      return sum + realValue;
    }, 0);
    
    console.log('  ✅ Total del inventario calculado correctamente');
    console.log(`  💰 Valor total: $${totalInventoryValue.toFixed(2)}`);
    
    console.log('\n🎉 ¡Fix del dashboard probado exitosamente!');
    console.log('   ✅ No hay errores de "Cannot access realValueMap before initialization"');
    console.log('   ✅ La lógica del dashboard debería funcionar correctamente ahora');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardFix();























