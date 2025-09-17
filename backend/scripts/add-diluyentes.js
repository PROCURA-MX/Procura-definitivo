const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function addDiluyentes() {
  try {
    console.log('🚀 Agregando categoría Diluyentes y productos...\n');
    
    let totalUpdated = 0;
    let totalInserted = 0;
    
    // Productos diluyentes
    const diluyentes = [
      { name: 'Evans', existingId: 'evans' },
      { name: 'VITS', existingId: 'vits' },
      { name: 'Bacteriana', existingId: 'bacteriana' }
    ];
    
    for (const diluyente of diluyentes) {
      try {
        // Verificar si el producto existe
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { id: diluyente.existingId },
              { name: diluyente.name }
            ]
          }
        });
        
        if (existingProduct) {
          // Actualizar categoría del producto existente
          const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              category: 'Diluyentes',
              updatedAt: new Date()
            }
          });
          
          console.log(`  ✅ Actualizado: ${diluyente.name} (ID: ${updatedProduct.id}) -> Categoría: Diluyentes`);
          totalUpdated++;
        } else {
          // Crear nuevo producto
          const newProduct = await prisma.product.create({
            data: {
              id: uuidv4(),
              name: diluyente.name,
              category: 'Diluyentes',
              type: 'SIMPLE',
              unit: 'PIECE',
              costPerUnit: 0.00,
              minStockLevel: 0,
              updatedAt: new Date()
            }
          });
          
          console.log(`  ✅ Insertado: ${diluyente.name} (ID: ${newProduct.id})`);
          totalInserted++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error con ${diluyente.name}:`, error.message);
      }
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Productos actualizados: ${totalUpdated}`);
    console.log(`✅ Productos insertados: ${totalInserted}`);
    console.log(`📦 Total procesados: ${totalUpdated + totalInserted}`);
    
    // Verificar resultado final
    console.log('\n📈 VERIFICACIÓN FINAL:');
    const diluyentesFinal = await prisma.product.findMany({
      where: { category: 'Diluyentes' }
    });
    
    console.log(`  Categoría "Diluyentes": ${diluyentesFinal.length} productos`);
    diluyentesFinal.forEach(product => {
      console.log(`    - ${product.name} (ID: ${product.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDiluyentes();




















