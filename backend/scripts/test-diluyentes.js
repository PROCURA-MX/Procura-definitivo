const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDiluyentes() {
  try {
    console.log('🧪 Probando funcionalidad de diluyentes...\n');
    
    // 1. Verificar que los diluyentes existen en la base de datos
    console.log('📦 1. Verificando productos diluyentes en BD:');
    const diluyentes = await prisma.product.findMany({
      where: { category: 'Diluyentes' }
    });
    
    if (diluyentes.length > 0) {
      console.log(`  ✅ Encontrados ${diluyentes.length} diluyentes:`);
      diluyentes.forEach(d => {
        console.log(`    - ${d.name} (ID: ${d.id})`);
      });
    } else {
      console.log('  ❌ No se encontraron diluyentes');
      return;
    }
    
    // 2. Verificar que se pueden obtener por categoría
    console.log('\n🔍 2. Probando obtención por categoría:');
    const diluyentesPorCategoria = await prisma.product.findMany({
      where: { category: 'Diluyentes' },
      select: { id: true, name: true, category: true }
    });
    
    console.log(`  ✅ Obtenidos ${diluyentesPorCategoria.length} productos de categoría "Diluyentes"`);
    
    // 3. Verificar que no hay duplicados
    console.log('\n🔍 3. Verificando duplicados:');
    const nombres = diluyentes.map(d => d.name);
    const nombresUnicos = [...new Set(nombres)];
    
    if (nombres.length === nombresUnicos.length) {
      console.log('  ✅ No hay duplicados en nombres');
    } else {
      console.log('  ❌ Se encontraron duplicados en nombres');
    }
    
    // 4. Verificar que los productos específicos existen
    console.log('\n🔍 4. Verificando productos específicos:');
    const productosEspecificos = ['Evans', 'VITS', 'Bacteriana'];
    
    for (const nombre of productosEspecificos) {
      const producto = await prisma.product.findFirst({
        where: { 
          name: nombre,
          category: 'Diluyentes'
        }
      });
      
      if (producto) {
        console.log(`  ✅ ${nombre}: Existe (ID: ${producto.id})`);
      } else {
        console.log(`  ❌ ${nombre}: No existe en categoría Diluyentes`);
      }
    }
    
    // 5. Verificar estadísticas generales
    console.log('\n📊 5. Estadísticas generales:');
    const totalProductos = await prisma.product.count();
    const totalDiluyentes = await prisma.product.count({
      where: { category: 'Diluyentes' }
    });
    
    console.log(`  📦 Total productos en BD: ${totalProductos}`);
    console.log(`  💧 Total diluyentes: ${totalDiluyentes}`);
    console.log(`  📈 Porcentaje diluyentes: ${((totalDiluyentes / totalProductos) * 100).toFixed(1)}%`);
    
    console.log('\n🎉 ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDiluyentes();






















