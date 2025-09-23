const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeProductDuplication() {
  try {
    console.log('🔍 ANÁLISIS DE DUPLICACIÓN DE PRODUCTOS...\n');
    
    const products = await prisma.product.findMany({
      select: { id: true, name: true, category: true, organizacion_id: true }
    });
    
    console.log(`📦 Total de productos: ${products.length}\n`);
    
    const grouped = {};
    products.forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    
    let duplicatesFound = 0;
    Object.entries(grouped).forEach(([name, products]) => {
      if (products.length > 1) {
        duplicatesFound++;
        console.log(`🚨 DUPLICADO: "${name}" (${products.length} productos)`);
        products.forEach((p, i) => {
          console.log(`  ${i+1}. ID: ${p.id}`);
          console.log(`     Org: ${p.organizacion_id}`);
          console.log(`     Cat: ${p.category}`);
        });
        console.log('');
      }
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`- Productos únicos: ${Object.keys(grouped).length}`);
    console.log(`- Nombres duplicados: ${duplicatesFound}`);
    console.log(`- Total duplicados: ${products.length - Object.keys(grouped).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProductDuplication();






const prisma = new PrismaClient();

async function analyzeProductDuplication() {
  try {
    console.log('🔍 ANÁLISIS DE DUPLICACIÓN DE PRODUCTOS...\n');
    
    const products = await prisma.product.findMany({
      select: { id: true, name: true, category: true, organizacion_id: true }
    });
    
    console.log(`📦 Total de productos: ${products.length}\n`);
    
    const grouped = {};
    products.forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    
    let duplicatesFound = 0;
    Object.entries(grouped).forEach(([name, products]) => {
      if (products.length > 1) {
        duplicatesFound++;
        console.log(`🚨 DUPLICADO: "${name}" (${products.length} productos)`);
        products.forEach((p, i) => {
          console.log(`  ${i+1}. ID: ${p.id}`);
          console.log(`     Org: ${p.organizacion_id}`);
          console.log(`     Cat: ${p.category}`);
        });
        console.log('');
      }
    });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`- Productos únicos: ${Object.keys(grouped).length}`);
    console.log(`- Nombres duplicados: ${duplicatesFound}`);
    console.log(`- Total duplicados: ${products.length - Object.keys(grouped).length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProductDuplication();








