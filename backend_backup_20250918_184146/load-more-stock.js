const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const additionalStockData = [
  {
    productId: 'product-6',
    quantity: 20
  },
  {
    productId: 'product-7',
    quantity: 75
  },
  {
    productId: 'product-8',
    quantity: 60
  },
  {
    productId: 'product-9',
    quantity: 18
  },
  {
    productId: 'product-10',
    quantity: 15
  }
];

async function loadMoreStock() {
  try {
    console.log('🔄 Cargando stock adicional...');
    
    for (const stock of additionalStockData) {
      await prisma.stockBySede.upsert({
        where: {
          productId_sedeId: {
            sedeId: 'sede-tecamachalco',
            productId: stock.productId
          }
        },
        update: {
          quantity: stock.quantity,
          updatedAt: new Date()
        },
        create: {
          id: `stock-${stock.productId}`,
          sedeId: 'sede-tecamachalco',
          productId: stock.productId,
          quantity: stock.quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Stock cargado para producto: ${stock.productId} - Cantidad: ${stock.quantity}`);
    }
    
    console.log('🎉 Todo el stock adicional cargado exitosamente');
  } catch (error) {
    console.error('❌ Error cargando stock adicional:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadMoreStock();
