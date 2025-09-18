const { PrismaClient } = require('@prisma/client');

async function checkProducts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Buscando productos con "alxoid" en el nombre o ID...');
    
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'alxoid', mode: 'insensitive' } },
          { id: { contains: 'alxoid', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true
      }
    });
    
    console.log(`📦 Productos encontrados: ${products.length}`);
    products.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name}, Category: ${p.category}`);
    });
    
    console.log('\n🔍 Buscando productos con "alxoid" exacto...');
    const exactProduct = await prisma.product.findUnique({
      where: { id: 'alxoid-tipo-a' },
      select: {
        id: true,
        name: true,
        category: true
      }
    });
    
    if (exactProduct) {
      console.log(`✅ Producto encontrado: ${exactProduct.name}`);
    } else {
      console.log('❌ Producto "alxoid-tipo-a" NO encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();







