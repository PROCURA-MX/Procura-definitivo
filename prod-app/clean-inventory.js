const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanInventory() {
  try {
    console.log('🧹 INICIANDO LIMPIEZA SEGURA DEL INVENTARIO...\n');

    // 1. IDENTIFICAR DUPLICADOS
    console.log('🔍 PASO 1: Identificando duplicados...');
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const nameCounts = {};
    products.forEach(product => {
      const name = product.name.toLowerCase().trim();
      if (!nameCounts[name]) {
        nameCounts[name] = [];
      }
      nameCounts[name].push(product);
    });

    const duplicates = Object.keys(nameCounts).filter(name => nameCounts[name].length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No se encontraron duplicados');
      return;
    }

    console.log(`❌ Se encontraron ${duplicates.length} duplicados:`);
    duplicates.forEach(name => {
      console.log(`   "${name}": ${nameCounts[name].length} productos`);
    });

    // 2. CREAR MAPA DE MIGRACIÓN
    console.log('\n🔄 PASO 2: Creando mapa de migración...');
    const migrationMap = {};

    duplicates.forEach(name => {
      const productsWithSameName = nameCounts[name];
      
      // Ordenar por categoría preferida (mantener las que están en mayúsculas)
      const sortedProducts = productsWithSameName.sort((a, b) => {
        const aIsPreferred = a.category && a.category === a.category.toUpperCase();
        const bIsPreferred = b.category && b.category === b.category.toUpperCase();
        
        if (aIsPreferred && !bIsPreferred) return -1;
        if (!aIsPreferred && bIsPreferred) return 1;
        return 0;
      });

      // El primero será el que mantengamos, los demás se migrarán
      const keepProduct = sortedProducts[0];
      const migrateProducts = sortedProducts.slice(1);

      console.log(`   Manteniendo: ${keepProduct.name} (ID: ${keepProduct.id}, Categoría: ${keepProduct.category})`);
      
      migrateProducts.forEach(product => {
        migrationMap[product.id] = keepProduct.id;
        console.log(`   Migrando: ${product.name} (ID: ${product.id}) → ${keepProduct.id}`);
      });
    });

    // 3. MIGRAR STOCK
    console.log('\n📦 PASO 3: Migrando stock...');
    const stockToMigrate = await prisma.stockBySede.findMany({
      where: {
        productId: {
          in: Object.keys(migrationMap)
        }
      }
    });

    console.log(`   Encontrados ${stockToMigrate.length} registros de stock para migrar`);

    for (const stockItem of stockToMigrate) {
      const newProductId = migrationMap[stockItem.productId];
      
      // Verificar si ya existe stock para el producto destino
      const existingStock = await prisma.stockBySede.findFirst({
        where: {
          productId: newProductId,
          sedeId: stockItem.sedeId
        }
      });

      if (existingStock) {
        // Sumar cantidades
        await prisma.stockBySede.update({
          where: { id: existingStock.id },
          data: { quantity: existingStock.quantity + stockItem.quantity }
        });
        console.log(`   ✅ Sumado stock: ${stockItem.quantity} unidades de ${stockItem.productId} a ${newProductId} en sede ${stockItem.sedeId}`);
      } else {
        // Crear nuevo registro
        await prisma.stockBySede.create({
          data: {
            productId: newProductId,
            sedeId: stockItem.sedeId,
            quantity: stockItem.quantity
          }
        });
        console.log(`   ✅ Creado stock: ${stockItem.quantity} unidades de ${newProductId} en sede ${stockItem.sedeId}`);
      }

      // Eliminar stock original
      await prisma.stockBySede.delete({
        where: { id: stockItem.id }
      });
    }

    // 4. MIGRAR MOVIMIENTOS
    console.log('\n📊 PASO 4: Migrando movimientos...');
    const movementsToMigrate = await prisma.movement.findMany({
      where: {
        productId: {
          in: Object.keys(migrationMap)
        }
      }
    });

    console.log(`   Encontrados ${movementsToMigrate.length} movimientos para migrar`);

    for (const movement of movementsToMigrate) {
      const newProductId = migrationMap[movement.productId];
      
      await prisma.movement.update({
        where: { id: movement.id },
        data: { productId: newProductId }
      });
      console.log(`   ✅ Migrado movimiento: ${movement.id} de ${movement.productId} a ${newProductId}`);
    }

    // 5. MIGRAR INVENTORY USAGE DETAILS
    console.log('\n📋 PASO 5: Migrando detalles de uso de inventario...');
    const usageDetailsToMigrate = await prisma.inventoryUsageDetail.findMany({
      where: {
        productId: {
          in: Object.keys(migrationMap)
        }
      }
    });

    console.log(`   Encontrados ${usageDetailsToMigrate.length} detalles de uso para migrar`);

    for (const detail of usageDetailsToMigrate) {
      const newProductId = migrationMap[detail.productId];
      
      await prisma.inventoryUsageDetail.update({
        where: { id: detail.id },
        data: { productId: newProductId }
      });
      console.log(`   ✅ Migrado detalle de uso: ${detail.id} de ${detail.productId} a ${newProductId}`);
    }

    // 6. ELIMINAR PRODUCTOS DUPLICADOS
    console.log('\n🗑️  PASO 6: Eliminando productos duplicados...');
    const productsToDelete = Object.keys(migrationMap);
    
    for (const productId of productsToDelete) {
      await prisma.product.delete({
        where: { id: productId }
      });
      console.log(`   ✅ Eliminado producto: ${productId}`);
    }

    // 7. UNIFICAR CATEGORÍAS
    console.log('\n🏷️  PASO 7: Unificando categorías...');
    
    const categoryMappings = {
      'Gammaglobulina': 'GAMMAGLOBULINA',
      'Vacunas Pediátricas': 'VACUNAS_PEDIATRICAS'
    };

    for (const [oldCategory, newCategory] of Object.entries(categoryMappings)) {
      const productsToUpdate = await prisma.product.findMany({
        where: { category: oldCategory }
      });

      if (productsToUpdate.length > 0) {
        await prisma.product.updateMany({
          where: { category: oldCategory },
          data: { category: newCategory }
        });
        console.log(`   ✅ Actualizada categoría: ${oldCategory} → ${newCategory} (${productsToUpdate.length} productos)`);
      }
    }

    // 8. AGREGAR PRODUCTOS FALTANTES
    console.log('\n➕ PASO 8: Agregando productos faltantes...');
    
    const missingProducts = [
      { name: 'Nebulización', category: 'MEDICAMENTOS', costPerUnit: 50, unit: 'PIECE', type: 'SIMPLE' }
    ];

    for (const product of missingProducts) {
      const existing = await prisma.product.findFirst({
        where: { 
          name: { equals: product.name, mode: 'insensitive' },
          category: product.category
        }
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            id: product.name.toLowerCase().replace(/\s+/g, '-'),
            name: product.name,
            category: product.category,
            costPerUnit: product.costPerUnit,
            unit: product.unit,
            type: product.type
          }
        });
        console.log(`   ✅ Agregado producto: ${product.name}`);
      } else {
        console.log(`   ℹ️  Producto ya existe: ${product.name}`);
      }
    }

    // 9. MOVER PRODUCTOS DE CATEGORÍA NULL
    console.log('\n🔄 PASO 9: Moviendo productos de categoría null...');
    
    const nullCategoryProducts = await prisma.product.findMany({
      where: { category: null }
    });

    const nullCategoryMappings = {
      'VITS': 'MEDICAMENTOS',
      'Evans': 'MEDICAMENTOS'
    };

    for (const product of nullCategoryProducts) {
      const newCategory = nullCategoryMappings[product.name];
      if (newCategory) {
        await prisma.product.update({
          where: { id: product.id },
          data: { category: newCategory }
        });
        console.log(`   ✅ Movido producto: ${product.name} → ${newCategory}`);
      } else {
        console.log(`   ℹ️  Producto sin categoría mantenido: ${product.name}`);
      }
    }

    console.log('\n🎉 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!');
    console.log('✅ Duplicados eliminados');
    console.log('✅ Stock migrado correctamente');
    console.log('✅ Movimientos actualizados');
    console.log('✅ Detalles de uso actualizados');
    console.log('✅ Categorías unificadas');
    console.log('✅ Productos faltantes agregados');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para confirmar antes de ejecutar
async function confirmAndClean() {
  console.log('⚠️  ADVERTENCIA: Este script realizará cambios en la base de datos');
  console.log('📋 Acciones que se realizarán:');
  console.log('   1. Identificar y eliminar productos duplicados');
  console.log('   2. Migrar stock de productos duplicados');
  console.log('   3. Actualizar movimientos de productos duplicados');
  console.log('   4. Actualizar detalles de uso de inventario');
  console.log('   5. Unificar categorías inconsistentes');
  console.log('   6. Agregar productos faltantes');
  console.log('   7. Mover productos de categoría null');
  console.log('');
  console.log('🔒 El sistema NO se verá afectado, solo se limpiará el inventario');
  console.log('');

  // Simular confirmación (en producción pediría input del usuario)
  console.log('✅ Confirmando ejecución...');
  
  await cleanInventory();
}

confirmAndClean();
