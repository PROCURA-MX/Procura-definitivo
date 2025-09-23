const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const products = [
  {
    id: 'product-1',
    name: 'Phadiatop',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Alérgeno para pruebas de alergia',
    costPerUnit: 150.00,
    minStockLevel: 10,
    category: 'PRUEBAS'
  },
  {
    id: 'product-2',
    name: '6 Gramíneas',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Mezcla de 6 gramíneas para pruebas',
    costPerUnit: 200.00,
    minStockLevel: 5,
    category: 'PRUEBAS'
  },
  {
    id: 'product-3',
    name: 'Abedul',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Alérgeno de abedul',
    costPerUnit: 180.00,
    minStockLevel: 8,
    category: 'PRUEBAS'
  },
  {
    id: 'product-4',
    name: 'Jeringa 1ml',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Jeringa desechable de 1ml',
    costPerUnit: 5.00,
    minStockLevel: 50,
    category: 'MATERIALES'
  },
  {
    id: 'product-5',
    name: 'Algodón',
    type: 'SIMPLE',
    unit: 'PIECE',
    description: 'Algodón estéril',
    costPerUnit: 2.00,
    minStockLevel: 100,
    category: 'MATERIALES'
  }
];

async function loadProducts() {
  try {
    console.log('🔄 Cargando productos...');
    
    for (const product of products) {
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
      console.log(`✅ Producto cargado: ${product.name}`);
    }
    
    console.log('🎉 Todos los productos cargados exitosamente');
  } catch (error) {
    console.error('❌ Error cargando productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadProducts();
