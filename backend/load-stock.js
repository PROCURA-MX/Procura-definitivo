const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stockData = [
  {
    productId: 'product-1',
    quantity: 25
  },
  {
    productId: 'product-2',
    quantity: 15
  },
  {
    productId: 'product-3',
    quantity: 20
  },
  {
    productId: 'product-4',
    quantity: 100
  },
  {
    productId: 'product-5',
    quantity: 200
  }
];

async function loadStock() {
  try {
    console.log('🔄 Cargando stock inicial...');
    
    for (const stock of stockData) {
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
    
    console.log('🎉 Todo el stock cargado exitosamente');
  } catch (error) {
    console.error('❌ Error cargando stock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadStock();
