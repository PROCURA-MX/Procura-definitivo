const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardValues() {
  try {
    console.log('🧪 Probando cálculo de valores del dashboard...\n');
    
    // 1. Verificar movimientos de entrada para "Alérgenos"
    console.log('📦 1. Verificando movimientos de entrada para Alérgenos:');
    const allergenEntries = await prisma.movement.findMany({
      where: {
        type: 'ENTRY',
        Product: {
          category: 'Alérgenos'
        }
      },
      include: {
        Product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (allergenEntries.length > 0) {
      console.log(`  ✅ Encontrados ${allergenEntries.length} movimientos de entrada para Alérgenos:`);
      let totalValue = 0;
      allergenEntries.forEach(entry => {
        const value = Number(entry.totalCost);
        totalValue += value;
        console.log(`    - ${entry.Product.name}: ${entry.quantity} unidades, $${value.toFixed(2)} (totalCost)`);
      });
      console.log(`  💰 Valor total de entradas para Alérgenos: $${totalValue.toFixed(2)}`);
    } else {
      console.log('  ❌ No se encontraron movimientos de entrada para Alérgenos');
    }
    
    // 2. Verificar productos de la categoría "Alérgenos"
    console.log('\n🔍 2. Verificando productos de categoría Alérgenos:');
    const allergenProducts = await prisma.product.findMany({
      where: { category: 'Alérgenos' }
    });
    
    if (allergenProducts.length > 0) {
      console.log(`  ✅ Encontrados ${allergenProducts.length} productos de Alérgenos:`);
      allergenProducts.forEach(product => {
        console.log(`    - ${product.name}: costPerUnit: $${Number(product.costPerUnit).toFixed(2)}`);
      });
    } else {
      console.log('  ❌ No se encontraron productos de categoría Alérgenos');
    }
    
    // 3. Verificar stock actual para Alérgenos
    console.log('\n📊 3. Verificando stock actual para Alérgenos:');
    const allergenStock = await prisma.stockBySede.findMany({
      where: {
        Product: {
          category: 'Alérgenos'
        }
      },
      include: {
        Product: true
      }
    });
    
    if (allergenStock.length > 0) {
      console.log(`  ✅ Encontrado stock para ${allergenStock.length} productos de Alérgenos:`);
      let totalStockValue = 0;
      allergenStock.forEach(stock => {
        const stockValue = Number(stock.quantity) * Number(stock.Product.costPerUnit);
        totalStockValue += stockValue;
        console.log(`    - ${stock.Product.name}: ${stock.quantity} unidades, costPerUnit: $${Number(stock.Product.costPerUnit).toFixed(2)}, valor calculado: $${stockValue.toFixed(2)}`);
      });
      console.log(`  💰 Valor total calculado con costPerUnit: $${totalStockValue.toFixed(2)}`);
    } else {
      console.log('  ❌ No se encontró stock para productos de Alérgenos');
    }
    
    // 4. Comparar valores
    console.log('\n🔍 4. Comparando valores:');
    if (allergenEntries.length > 0 && allergenStock.length > 0) {
      const totalEntryValue = allergenEntries.reduce((sum, entry) => sum + Number(entry.totalCost), 0);
      const totalStockValue = allergenStock.reduce((sum, stock) => sum + (Number(stock.quantity) * Number(stock.Product.costPerUnit)), 0);
      
      console.log(`  📥 Valor total de entradas (totalCost): $${totalEntryValue.toFixed(2)}`);
      console.log(`  📦 Valor total calculado (stock × costPerUnit): $${totalStockValue.toFixed(2)}`);
      console.log(`  📊 Diferencia: $${Math.abs(totalEntryValue - totalStockValue).toFixed(2)}`);
      
      if (totalEntryValue !== totalStockValue) {
        console.log('  ⚠️  Los valores son diferentes - esto explica por qué el dashboard muestra $0');
        console.log('  💡 El dashboard debe usar totalCost de las entradas, no costPerUnit del producto');
      } else {
        console.log('  ✅ Los valores son iguales - el dashboard debería funcionar correctamente');
      }
    }
    
    console.log('\n🎉 ¡Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardValues();























