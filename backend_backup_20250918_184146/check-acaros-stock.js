const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAcarosStock() {
  try {
    console.log('🔍 Verificando stock de Ácaros en todas las sedes...');
    
    // Buscar el producto Ácaros
    const producto = await prisma.product.findFirst({
      where: { 
        name: { 
          contains: 'Ácaros', 
          mode: 'insensitive' 
        } 
      }
    });
    
    if (!producto) {
      console.log('❌ Producto Ácaros no encontrado');
      return;
    }
    
    console.log('✅ Producto encontrado:', producto.name, 'ID:', producto.id);
    
    // Verificar stock en todas las sedes
    const stock = await prisma.stockBySede.findMany({
      where: { productId: producto.id },
      include: { Sede: true }
    });
    
    console.log('📊 Stock actual de Ácaros:');
    if (stock.length === 0) {
      console.log('❌ NO HAY STOCK en ninguna sede');
    } else {
      stock.forEach(s => {
        console.log(`  - ${s.Sede.name} (${s.sedeId}): ${s.quantity} unidades`);
      });
    }
    
    // Verificar específicamente en sede-consultorio-teca-001
    const stockTeca = await prisma.stockBySede.findFirst({
      where: { 
        productId: producto.id,
        sedeId: 'sede-consultorio-teca-001'
      }
    });
    
    console.log('\n🎯 Stock específico en sede-consultorio-teca-001:');
    if (stockTeca) {
      console.log(`✅ Stock: ${stockTeca.quantity} unidades`);
    } else {
      console.log('❌ NO HAY STOCK en sede-consultorio-teca-001');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcarosStock();
