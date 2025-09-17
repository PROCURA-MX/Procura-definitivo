const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDiluyentes() {
  try {
    console.log('🔍 Verificando productos diluyentes existentes...\n');
    
    const diluyentes = ['Evans', 'VITS', 'Bacteriana'];
    
    for (const producto of diluyentes) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: producto
        }
      });
      
      if (existingProduct) {
        console.log(`✅ ${producto}: EXISTE (ID: ${existingProduct.id}, Categoría: ${existingProduct.category})`);
      } else {
        console.log(`❌ ${producto}: NO EXISTE`);
      }
    }
    
    // Verificar si existe la categoría "Diluyentes"
    const diluyentesCategory = await prisma.product.findFirst({
      where: {
        category: 'Diluyentes'
      }
    });
    
    console.log('\n📦 CATEGORÍA:');
    if (diluyentesCategory) {
      console.log('✅ Categoría "Diluyentes": EXISTE');
    } else {
      console.log('❌ Categoría "Diluyentes": NO EXISTE');
    }
    
    // Mostrar todos los productos que podrían ser diluyentes
    console.log('\n🔍 PRODUCTOS SIMILARES:');
    const similarProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Evans', mode: 'insensitive' } },
          { name: { contains: 'VITS', mode: 'insensitive' } },
          { name: { contains: 'Bacteriana', mode: 'insensitive' } },
          { category: { contains: 'Diluyente', mode: 'insensitive' } }
        ]
      }
    });
    
    if (similarProducts.length > 0) {
      similarProducts.forEach(product => {
        console.log(`  - ${product.name} (Categoría: ${product.category})`);
      });
    } else {
      console.log('  No se encontraron productos similares');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiluyentes();




















