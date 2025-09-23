const { PrismaClient } = require('@prisma/client');

// Simular la función de cálculo
function calculateGlicerinadoPorUnidad(unidades, tipoFrasco, alergenos, factorFrascoMadre = 1) {
  console.log(`🎯 Calculando Glicerinado por Unidad:`, {
    unidades,
    tipoFrasco,
    alergenos,
    factorFrascoMadre
  });

  // 1. Mililitros del frasco madre por alérgeno
  const mlFrascoMadre = (unidades / 10000) * factorFrascoMadre;
  
  // 2. Evans (diluyente) según tipo de frasco
  let evansFactor = 0;
  if (tipoFrasco === "frasco amarillo") {
    evansFactor = 9;
  } else if (tipoFrasco === "frasco verde") {
    evansFactor = 99;
  }
  // Si es frasco madre, evansFactor = 0
  
  const mlEvans = (unidades / 10000) * evansFactor;
  
  // 3. Bacteriana (diluyente)
  const mlBacteriana = factorFrascoMadre * 0.1;

  console.log(`📊 Cálculos intermedios:`, {
    mlFrascoMadre,
    evansFactor,
    mlEvans,
    mlBacteriana
  });

  return {
    alergenos: alergenos.map(alergeno => ({
      nombre: alergeno,
      mlConsumidos: mlFrascoMadre,
      costoTotal: 0 // Se calculará después con el precio real
    })),
    diluyentes: {
      evans: mlEvans,
      bacteriana: mlBacteriana
    }
  };
}

async function testGlicerinadoLogic() {
  console.log('🧪 PROBANDO LÓGICA DE GLICERINADO POR UNIDAD\n');
  
  // Caso 1: 1000 unidades, frasco madre
  console.log('📋 CASO 1: 1000 unidades, frasco madre');
  const caso1 = calculateGlicerinadoPorUnidad(1000, 'Madre', ['Abedul', 'Encino'], 1);
  console.log('✅ Resultado:', JSON.stringify(caso1, null, 2));
  console.log('');
  
  // Caso 2: 1000 unidades, frasco amarillo
  console.log('📋 CASO 2: 1000 unidades, frasco amarillo');
  const caso2 = calculateGlicerinadoPorUnidad(1000, 'frasco amarillo', ['Abedul', 'Encino'], 1);
  console.log('✅ Resultado:', JSON.stringify(caso2, null, 2));
  console.log('');
  
  // Caso 3: 1000 unidades, frasco verde
  console.log('📋 CASO 3: 1000 unidades, frasco verde');
  const caso3 = calculateGlicerinadoPorUnidad(1000, 'frasco verde', ['Abedul', 'Encino'], 1);
  console.log('✅ Resultado:', JSON.stringify(caso3, null, 2));
  console.log('');
  
  // Caso 4: 5000 unidades, frasco madre
  console.log('📋 CASO 4: 5000 unidades, frasco madre');
  const caso4 = calculateGlicerinadoPorUnidad(5000, 'Madre', ['Abedul', 'Encino'], 1);
  console.log('✅ Resultado:', JSON.stringify(caso4, null, 2));
  console.log('');
  
  console.log('🎯 RESUMEN DE LA LÓGICA:');
  console.log('- Para 1000 unidades con frasco madre: 0.1ml por alérgeno');
  console.log('- Para 1000 unidades con frasco amarillo: 0.1ml por alérgeno + 0.9ml Evans');
  console.log('- Para 1000 unidades con frasco verde: 0.1ml por alérgeno + 9.9ml Evans');
  console.log('- Bacteriana siempre: 0.1ml (factorFrascoMadre * 0.1)');
}

testGlicerinadoLogic().catch(console.error);
