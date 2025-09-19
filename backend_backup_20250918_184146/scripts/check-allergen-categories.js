const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllergenCategories() {
  try {
    console.log('🔍 Verificando categorías de alérgenos...\n');
    
    const allergens = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'Abedul', mode: 'insensitive' } },
          { name: { contains: 'Encino', mode: 'insensitive' } },
          { name: { contains: 'Fresno', mode: 'insensitive' } },
          { name: { contains: 'Ácaros', mode: 'insensitive' } },
          { name: { contains: 'Gramínea', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: true
      }
    });
    
    console.log('📊 Alérgenos encontrados:');
    allergens.forEach(a => {
      console.log(`- ${a.name}: ${a.category}`);
    });
    
    console.log('\n🔍 Verificando movimientos recientes...');
    const recentMovements = await prisma.movement.findMany({
      where: {
        type: 'EXIT',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
      },
      include: {
        Product: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n📊 Movimientos recientes:');
    recentMovements.forEach(m => {
      console.log(`- ${m.Product.name} (${m.Product.category}): ${m.quantity}ml - ${m.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllergenCategories();
