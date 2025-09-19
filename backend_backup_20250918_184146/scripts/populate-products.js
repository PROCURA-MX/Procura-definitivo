const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Productos a insertar organizados por categoría
const productsToInsert = {
  'Medicamentos': [
    'Bacmune',
    'Transferón', 
    'Diprospán',
    'Nebulización'
  ],
  'Alérgenos Alxoid': [
    'Ambrosía A', 'Ambrosía B',
    'Ácaros A', 'Ácaros B',
    'Cupressus Arizónica A', 'Cupressus Arizónica B',
    'Encino A', 'Encino B',
    'Fresno A', 'Fresno B',
    'Gato A', 'Gato B',
    'Gramínea con sinodon A', 'Gramínea con sinodon B',
    'Sinodon A', 'Sinodon B',
    'Perro A', 'Perro B',
    '6 Gramíneas A', '6 Gramíneas B'
  ],
  'Alérgenos': [
    'Abedul', 'Ácaros', 'Álamo del este', 'Ambrosía', 'Caballo',
    'Camarón', 'Ciprés de Arizona', 'Encino', 'Fresno blanco', 'Gato',
    'Manzana', 'Cucaracha', 'Mezcla pastos', 'Perro', 'Pescado varios',
    'Pino blanco', 'Pistache', 'Trueno'
  ],
  'Pruebas': [
    'Alex de alergia molecular', 'Phadiatop', 'Prick', 'Prick to Prick',
    'Pruebas con alimentos', 'Prueba de suero', 'FeNO', 'COVID/Influenza',
    'Estreptococo B', 'Influenza A y B/Sincitial/Adenovirus'
  ],
  'Gammaglobulina': [
    'Hizentra 4GR', 'Hizentra 2GR', 'TENGELINE 10% 5G/50ML',
    'TENGELINE 10G/100ML', 'HIGLOBIN 10GR'
  ],
  'Vacunas Pediátricas': [
    'Adacel Boost', 'Gardasil', 'Gardasil 9', 'Hepatitis A y B',
    'Fiebre Amarilla', 'Herpes Zóster', 'Hexacima', 'Influenza',
    'Menactra', 'MMR', 'Prevenar 13 V', 'Proquad', 'Pulmovax',
    'Rota Teq', 'Vaqta', 'Varivax'
  ]
};

async function populateProducts() {
  try {
    console.log('🚀 Iniciando población de productos...');
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    for (const [category, products] of Object.entries(productsToInsert)) {
      console.log(`\n📦 Procesando categoría: ${category}`);
      
      for (const productName of products) {
        try {
          // Verificar si el producto ya existe
          const existingProduct = await prisma.product.findFirst({
            where: {
              name: productName,
              category: category
            }
          });
          
          if (existingProduct) {
            console.log(`  ⏭️  Saltando: ${productName} (ya existe)`);
            totalSkipped++;
            continue;
          }
          
          // Insertar nuevo producto con todos los campos requeridos
          const newProduct = await prisma.product.create({
            data: {
              id: uuidv4(),
              name: productName,
              category: category,
              type: 'SIMPLE', // Valor correcto del enum
              unit: 'PIECE', // Valor correcto del enum
              costPerUnit: 0.00,
              minStockLevel: 0,
              updatedAt: new Date()
            }
          });
          
          console.log(`  ✅ Insertado: ${productName} (ID: ${newProduct.id})`);
          totalInserted++;
          
        } catch (error) {
          console.error(`  ❌ Error al insertar ${productName}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log(`✅ Productos insertados: ${totalInserted}`);
    console.log(`⏭️  Productos saltados (ya existían): ${totalSkipped}`);
    console.log(`📦 Total procesados: ${totalInserted + totalSkipped}`);
    
    // Mostrar estadísticas por categoría
    console.log('\n📈 ESTADÍSTICAS POR CATEGORÍA:');
    for (const category of Object.keys(productsToInsert)) {
      const count = await prisma.product.count({
        where: { category: category }
      });
      console.log(`  ${category}: ${count} productos`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
populateProducts();
