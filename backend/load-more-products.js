const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const additionalProducts = [
  {
    id: 'product-6',
    name: 'Bacmune',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Medicamento inmunomodulador',
    costPerUnit: 100.00,
    minStockLevel: 15,
    category: 'Medicamentos'
  },
  {
    id: 'product-7',
    name: 'Paracetamol',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Analgésico y antipirético',
    costPerUnit: 25.00,
    minStockLevel: 50,
    category: 'Medicamentos'
  },
  {
    id: 'product-8',
    name: 'Ibuprofeno',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Antiinflamatorio no esteroideo',
    costPerUnit: 30.00,
    minStockLevel: 40,
    category: 'Medicamentos'
  },
  {
    id: 'product-9',
    name: 'Ácaros del Polvo',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Alérgeno para pruebas de alergia',
    costPerUnit: 120.00,
    minStockLevel: 12,
    category: 'Alérgenos'
  },
  {
    id: 'product-10',
    name: 'Gato',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Alérgeno de gato para pruebas',
    costPerUnit: 110.00,
    minStockLevel: 10,
    category: 'Alérgenos'
  }
];

async function loadMoreProducts() {
  try {
    console.log('🔄 Cargando productos adicionales...');
    
    for (const product of additionalProducts) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          ...product,
          updatedAt: new Date()
        },
        create: {
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Producto cargado: ${product.name} (${product.category})`);
    }
    
    console.log('🎉 Todos los productos adicionales cargados exitosamente');
  } catch (error) {
    console.error('❌ Error cargando productos adicionales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadMoreProducts();
