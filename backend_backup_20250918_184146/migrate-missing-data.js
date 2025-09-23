const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

const prisma = new PrismaClient();

// Conexión a Supabase para leer datos
const supabaseClient = new Client({
  connectionString: 'postgresql://postgres:Garuesgay1808@db.xfcmnlysnptclkgxfeab.supabase.co:5432/postgres'
});

async function migrateMissingData() {
  try {
    console.log('🔄 Conectando a Supabase...');
    await supabaseClient.connect();
    
    // 0. Agregar sedes faltantes
    console.log('📥 Agregando sedes faltantes...');
    await prisma.sede.upsert({
      where: { id: 'sede-angeles' },
      update: { name: 'Sede Angeles' },
      create: {
        id: 'sede-angeles',
        name: 'Sede Angeles',
        address: 'Dirección de Sede Angeles',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Sede Angeles agregada');
    
    // 1. Migrar usuarios faltantes (ya completado)
    console.log('✅ Usuarios ya migrados (12 usuarios)');
    
    // 2. Migrar productos faltantes
    console.log('📥 Migrando productos...');
    const products = await supabaseClient.query('SELECT id, name, type, unit, description, "costPerUnit", "minStockLevel", category, "createdAt", "updatedAt" FROM "Product"');
    
    for (const product of products.rows) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          type: product.type,
          unit: product.unit,
          description: product.description,
          costPerUnit: product.costPerUnit,
          minStockLevel: product.minStockLevel,
          category: product.category,
          updatedAt: new Date()
        },
        create: {
          id: product.id,
          name: product.name,
          type: product.type,
          unit: product.unit,
          description: product.description,
          costPerUnit: product.costPerUnit,
          minStockLevel: product.minStockLevel,
          category: product.category,
          createdAt: product.createdAt || new Date(),
          updatedAt: product.updatedAt || new Date()
        }
      });
      console.log(`✅ Producto migrado: ${product.name} (${product.category})`);
    }
    
    // 3. Migrar stock faltante
    console.log('📥 Migrando stock...');
    const stock = await supabaseClient.query('SELECT id, "sedeId", "productId", quantity, "createdAt", "updatedAt" FROM "StockBySede"');
    
    for (const stockItem of stock.rows) {
      await prisma.stockBySede.upsert({
        where: {
          productId_sedeId: {
            sedeId: stockItem.sedeId,
            productId: stockItem.productId
          }
        },
        update: {
          quantity: stockItem.quantity,
          updatedAt: new Date()
        },
        create: {
          id: stockItem.id,
          sedeId: stockItem.sedeId,
          productId: stockItem.productId,
          quantity: stockItem.quantity,
          createdAt: stockItem.createdAt || new Date(),
          updatedAt: stockItem.updatedAt || new Date()
        }
      });
      console.log(`✅ Stock migrado para producto: ${stockItem.productId}`);
    }
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await supabaseClient.end();
    await prisma.$disconnect();
  }
}

migrateMissingData();
