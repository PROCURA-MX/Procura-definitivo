const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeInventory() {
  try {
    console.log('🔍 ANALIZANDO ESTADO ACTUAL DEL INVENTARIO...\n');

    // 1. Obtener todos los productos existentes
    console.log('📋 PRODUCTOS EXISTENTES:');
    const products = await prisma.product.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    const productsByCategory = {};
    products.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push({
        id: product.id,
        name: product.name,
        category: product.category,
        costPerUnit: product.costPerUnit,
        unit: product.unit
      });
    });

    Object.keys(productsByCategory).forEach(category => {
      console.log(`\n🏷️  CATEGORÍA: ${category}`);
      console.log(`   Total productos: ${productsByCategory[category].length}`);
      productsByCategory[category].forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id}) - $${product.costPerUnit} ${product.unit}`);
      });
    });

    // 2. Verificar duplicados por nombre
    console.log('\n🔍 VERIFICANDO DUPLICADOS POR NOMBRE:');
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
      console.log('✅ No se encontraron duplicados por nombre');
    } else {
      console.log(`❌ Se encontraron ${duplicates.length} nombres duplicados:`);
      duplicates.forEach(name => {
        console.log(`   "${name}": ${nameCounts[name].length} productos`);
        nameCounts[name].forEach(product => {
          console.log(`     - ID: ${product.id}, Categoría: ${product.category}`);
        });
      });
    }

    // 3. Verificar stock existente
    console.log('\n📦 STOCK EXISTENTE:');
    const stock = await prisma.stockBySede.findMany();

    const stockBySede = {};
    stock.forEach(item => {
      if (!stockBySede[item.sedeId]) {
        stockBySede[item.sedeId] = [];
      }
      stockBySede[item.sedeId].push({
        productId: item.productId,
        quantity: item.quantity,
        sedeId: item.sedeId
      });
    });

    // Obtener nombres de productos para el stock
    const productIds = [...new Set(stock.map(item => item.productId))];
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const productNameMap = {};
    productNames.forEach(product => {
      productNameMap[product.id] = product.name;
    });

    Object.keys(stockBySede).forEach(sedeId => {
      console.log(`\n🏥 SEDE: ${sedeId}`);
      stockBySede[sedeId].forEach(item => {
        const productName = productNameMap[item.productId] || 'Producto no encontrado';
        console.log(`   - ${productName}: ${item.quantity} unidades`);
      });
    });

    // 4. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`   Total productos: ${products.length}`);
    console.log(`   Categorías: ${Object.keys(productsByCategory).length}`);
    console.log(`   Sedes con stock: ${Object.keys(stockBySede).length}`);
    console.log(`   Total registros de stock: ${stock.length}`);

    // 5. Productos esperados vs existentes
    console.log('\n🎯 PRODUCTOS ESPERADOS vs EXISTENTES:');
    
    const expectedProducts = {
      'VACUNAS_PEDIATRICAS': [
        'Adacel Boost', 'Gardasil', 'Gardasil 9', 'Hepatitis A y B', 'Fiebre Amarilla',
        'Herpes Zóster', 'Hexacima', 'Influenza', 'Menactra', 'MMR', 'Prevenar 13 V',
        'Proquad', 'Pulmovax', 'Rota Teq', 'Vaqta', 'Varivax'
      ],
      'GAMMAGLOBULINA': [
        'Hizentra 4GR', 'Hizentra 2GR', 'TENGELINE 10% 5G/50ML', 'TENGELINE 10G/100ML', 'HIGLOBIN 10GR'
      ],
      'PRUEBAS': [
        'Alex de alergia molecular', 'Phadiatop', 'Prick', 'Prick to Prick', 'Pruebas con alimentos',
        'Prueba de suero', 'FeNO', 'COVID/Influenza', 'Estreptococo B', 'Influenza A y B/Sincitial/ AdenovirusTrueno'
      ],
      'INMUNOTERAPIA': [
        'Abedul', 'Ácaros', 'Álamo del este', 'Ambrosía', 'Caballo', 'Camarón', 'Ciprés de Arizona',
        'Encino', 'Fresno blanco', 'Gato', 'Manzana', 'Cucaracha', 'Mezcla pastos', 'Perro',
        'Pescado varios', 'Pino blanco', 'Pistache', 'Trueno'
      ],
      'MEDICAMENTOS': [
        'Bacmune', 'Transferón', 'Diprospán', 'Nebulización'
      ]
    };

    Object.keys(expectedProducts).forEach(category => {
      console.log(`\n🏷️  ${category}:`);
      const existingInCategory = productsByCategory[category] || [];
      const existingNames = existingInCategory.map(p => p.name.toLowerCase());
      
      expectedProducts[category].forEach(expectedName => {
        const exists = existingNames.includes(expectedName.toLowerCase());
        const status = exists ? '✅' : '❌';
        console.log(`   ${status} ${expectedName}`);
      });
    });

  } catch (error) {
    console.error('❌ Error analizando inventario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeInventory();
