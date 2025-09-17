const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAcarosStock() {
  try {
    console.log('🔍 Verificando productos Ácaros...');
    
    // Buscar TODOS los productos que contengan "Ácaros"
    const productos = await prisma.product.findMany({
      where: { 
        name: { 
          contains: 'Ácaros', 
          mode: 'insensitive' 
        } 
      }
    });
    
    console.log('📋 Productos encontrados:');
    productos.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}, Categoría: ${p.category})`);
    });
    
    // Buscar el producto específico que está causando el error
    const productoError = await prisma.product.findFirst({
      where: { id: 'prod-alergenos-002-org2' }
    });
    
    if (productoError) {
      console.log(`\n🎯 Producto que causa el error: ${productoError.name}`);
      
      // Verificar si ya tiene stock
      const stockExistente = await prisma.stockBySede.findFirst({
        where: { 
          productId: productoError.id,
          sedeId: 'sede-consultorio-teca-001'
        }
      });
      
      if (stockExistente) {
        console.log(`✅ Ya tiene stock: ${stockExistente.quantity} unidades`);
      } else {
        console.log('❌ NO tiene stock - Agregando stock...');
        
        // Agregar stock
        const nuevoStock = await prisma.stockBySede.create({
          data: {
            id: `stock-${productoError.id}-sede-consultorio-teca-001`,
            productId: productoError.id,
            sedeId: 'sede-consultorio-teca-001',
            quantity: 1000, // Mismo stock que Ácaros A
            organizacion_id: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Stock agregado: ${nuevoStock.quantity} unidades`);
      }
    } else {
      console.log('❌ Producto prod-alergenos-002-org2 no encontrado');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAcarosStock();
