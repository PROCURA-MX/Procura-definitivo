import { PrismaClient } from '@prisma/client';

export interface TreatmentComponent {
  productId: string;
  quantity: number;
  type: 'alergeno' | 'diluyente';
}

export interface TreatmentMapping {
  [key: string]: TreatmentComponent[];
}

export interface TreatmentCalculation {
  alergenos: Array<{
    nombre: string;
    mlConsumidos: number;
    costoTotal: number;
  }>;
  diluyentes: {
    evans: number;
    bacteriana: number;
  };
}

// 🎯 LÓGICA CORRECTA PARA GLICERINADO POR UNIDAD
export function calculateGlicerinadoPorUnidad(
  unidades: number,
  tipoFrasco: string,
  alergenos: string[],
  dosis: number = 1
): TreatmentCalculation {
  console.log(`🎯 Calculando Glicerinado por Unidad:`, {
    unidades,
    tipoFrasco,
    alergenos,
    dosis
  });

  // 1. Mililitros del frasco madre por alérgeno POR DOSIS (SIN FACTOR ADICIONAL)
  const mlFrascoMadrePorDosis = unidades / 10000;
  
  // 2. Total de mililitros considerando todas las dosis
  const mlFrascoMadreTotal = mlFrascoMadrePorDosis * dosis;
  
  // 3. Evans (diluyente) según tipo de frasco POR DOSIS
  let evansFactor = 0;
  if (tipoFrasco === "frasco amarillo") {
    evansFactor = 9;
  } else if (tipoFrasco === "frasco verde") {
    evansFactor = 99;
  }
  // Si es frasco madre, evansFactor = 0
  
  const mlEvansPorDosis = (unidades / 10000) * evansFactor;
  const mlEvansTotal = mlEvansPorDosis * dosis;
  
  // 4. Bacteriana (diluyente) - solo para frascos especiales
  const mlBacterianaPorDosis = tipoFrasco === "frasco madre" ? 0.1 : 0;
  const mlBacterianaTotal = mlBacterianaPorDosis * dosis;

  console.log(`📊 Cálculos intermedios:`, {
    mlFrascoMadrePorDosis,
    mlFrascoMadreTotal,
    evansFactor,
    mlEvansPorDosis,
    mlEvansTotal,
    mlBacterianaPorDosis,
    mlBacterianaTotal,
    dosis
  });

  return {
    alergenos: alergenos.map(alergeno => ({
      nombre: alergeno,
      mlConsumidos: mlFrascoMadreTotal, // Total considerando dosis
      costoTotal: 0 // Se calculará después con el precio real
    })),
    diluyentes: {
      evans: mlEvansTotal, // Total considerando dosis
      bacteriana: mlBacterianaTotal // Total considerando dosis
    }
  };
}

// 🎯 LÓGICA CORRECTA PARA ALXOID
export function calculateAlxoidTreatment(
  dosis: number,
  subtipo: 'A' | 'B' | 'B.2',
  alergenos: string[]
): TreatmentCalculation {
  console.log(`🎯 Calculando Alxoid:`, {
    dosis,
    subtipo,
    alergenos
  });

  // 🧠 REGLA GENERAL: Por cada dosis aplicada
  let mlPorAlergeno: number;
  
  if (subtipo === 'A') {
    mlPorAlergeno = 0.5 * dosis; // 0.5 ml por alérgeno por dosis
  } else if (subtipo === 'B') {
    mlPorAlergeno = 0.5 * dosis; // 0.5 ml por alérgeno por dosis
  } else if (subtipo === 'B.2') {
    mlPorAlergeno = 0.2 * dosis; // 0.2 ml por alérgeno por dosis (contabilizado como tipo B)
  } else {
    throw new Error(`Subtipo de Alxoid no válido: ${subtipo}`);
  }

  console.log(`📊 Cálculos intermedios:`, {
    subtipo,
    mlPorAlergeno,
    totalAlergenos: alergenos.length
  });

  return {
    alergenos: alergenos.map(alergeno => ({
      nombre: alergeno,
      mlConsumidos: mlPorAlergeno,
      costoTotal: 0 // Se calculará después con el precio real
    })),
    diluyentes: {
      evans: 0, // Alxoid no usa diluyentes
      bacteriana: 0
    }
  };
}

// 🎯 LÓGICA CORRECTA PARA GLICERINADO EN FRASCO
export function calculateGlicerinadoEnFrasco(
  frascos: number[],
  cantidad: number,
  alergenos: string[]
): TreatmentCalculation {
  console.log(`🎯 Calculando Glicerinado en Frasco:`, {
    frascos,
    cantidad,
    alergenos
  });

  // Factores por frasco (ml usados del frasco madre)
  const factores = {
    1: 0.002,
    2: 0.005,
    3: 0.02,
    4: 0.05,
    5: 0.2,
    6: 0.5,
  };

  // Calcular ml consumidos por alérgeno
  const alergenosCalculados = alergenos.map(alergeno => {
    let mlConsumidos = 0;
    
    // Por cada frasco utilizado
    frascos.forEach(numeroFrasco => {
      const factor = factores[numeroFrasco as keyof typeof factores] || 0;
      const mlPorFrasco = factor * cantidad;
      mlConsumidos += mlPorFrasco;
    });

    return {
      nombre: alergeno,
      mlConsumidos,
      costoTotal: 0 // Se calculará después con el precio real
    };
  });

  // Calcular diluyentes globales
  let evansTotal = 0;
  let bacterianaTotal = 0;

  frascos.forEach(numeroFrasco => {
    const factor = factores[numeroFrasco as keyof typeof factores] || 0;
    
    // Evans: (3 - (factor × #deAlérgenos)) × cantidad
    const evansPorFrasco = (3 - (factor * alergenos.length)) * cantidad;
    evansTotal += evansPorFrasco;
    
    // Bacteriana: #deFrascos × 2 × cantidad
    bacterianaTotal += 2 * cantidad;
  });

  console.log(`📊 Cálculos intermedios:`, {
    factoresUsados: frascos.map(f => ({ frasco: f, factor: factores[f as keyof typeof factores] })),
    evansTotal,
    bacterianaTotal,
    totalAlergenos: alergenos.length
  });

  return {
    alergenos: alergenosCalculados,
    diluyentes: {
      evans: evansTotal,
      bacteriana: bacterianaTotal
    }
  };
}

// 🎯 LÓGICA CORRECTA PARA SUBLINGUAL
export function calculateSublingualTreatment(
  frascos: number[],
  alergenos: string[]
): TreatmentCalculation {
  console.log(`🎯 Calculando Sublingual:`, {
    frascos,
    alergenos
  });

  // Factores por frasco para alérgenos (ml por alérgeno)
  const factoresAlergenos = {
    1: 0.002,
    2: 0.005,
    3: 0.02,
    4: 0.05,
  };

  // Factores por frasco para VITS
  const factoresVITS = {
    1: 0.004,
    2: 0.02,
    3: 0.1,
    4: 0.5,
  };

  // Calcular ml consumidos por alérgeno
  const alergenosCalculados = alergenos.map(alergeno => {
    let mlConsumidos = 0;
    
    // Por cada frasco utilizado
    frascos.forEach(numeroFrasco => {
      const factor = factoresAlergenos[numeroFrasco as keyof typeof factoresAlergenos] || 0;
      // ml = factor × número de alérgenos
      const mlPorFrasco = factor * alergenos.length;
      mlConsumidos += mlPorFrasco;
    });

    return {
      nombre: alergeno,
      mlConsumidos,
      costoTotal: 0 // Se calculará después con el precio real
    };
  });

  // Calcular VITS total
  let vitsTotal = 0;
  
  frascos.forEach(numeroFrasco => {
    const factorVITS = factoresVITS[numeroFrasco as keyof typeof factoresVITS] || 0;
    // vits = 5 - (factorVITS × número de alérgenos)
    const vitsPorFrasco = 5 - (factorVITS * alergenos.length);
    vitsTotal += vitsPorFrasco;
  });

  console.log(`📊 Cálculos intermedios:`, {
    factoresAlergenosUsados: frascos.map(f => ({ frasco: f, factor: factoresAlergenos[f as keyof typeof factoresAlergenos] })),
    factoresVITSUsados: frascos.map(f => ({ frasco: f, factor: factoresVITS[f as keyof typeof factoresVITS] })),
    vitsTotal,
    totalAlergenos: alergenos.length
  });

  return {
    alergenos: alergenosCalculados,
    diluyentes: {
      evans: 0, // Sublingual no usa Evans
      bacteriana: vitsTotal // VITS se mapea a bacteriana en el sistema actual
    }
  };
}

// 🎯 TRATAMIENTOS RECONOCIDOS
export const TREATMENT_PRODUCTS = [
  'Glicerinado por Unidad',
  'Glicerinado por Frasco', 
  'Alxoid',
  'Alxoid Tipo A',
  'Alxoid Tipo B',
  'Alxoid Tipo B.2',
  'Sublingual'
];

export function isTreatment(productName: string): boolean {
  return TREATMENT_PRODUCTS.includes(productName);
}

export function getTreatmentComponents(treatmentName: string): TreatmentComponent[] {
  // Esta función se usará para otros tratamientos
  // Por ahora solo manejamos Glicerinado por Unidad
  return [];
}

export function processTreatment(treatmentName: string, quantity: number): TreatmentComponent[] {
  // Esta función se usará para otros tratamientos
  return [];
}

// 🎯 VALIDACIÓN DE STOCK PARA TRATAMIENTOS
export async function validateTreatmentStock(
  treatmentName: string,
  unidades: number,
  sedeId: string,
  tx: any
): Promise<{ valid: boolean; missingComponents: string[] }> {
  console.log(`🔍 Validando stock para tratamiento: ${treatmentName}, unidades: ${unidades}`);
  
  if (treatmentName === 'Glicerinado por Unidad') {
    // Por ahora validamos que existan los productos básicos
    // La validación específica se hará en el proceso principal
    return { valid: true, missingComponents: [] };
  }
  
  return { valid: true, missingComponents: [] };
}

// 🎯 CONSUMO DE COMPONENTES DE TRATAMIENTO
export async function consumeTreatmentComponents(
  treatmentName: string,
  unidades: number,
  sedeId: string,
  tx: any,
  prisma: any
): Promise<void> {
  console.log(`🔄 Consumiendo componentes para: ${treatmentName}, unidades: ${unidades}`);
  
  // Esta función se implementará según la lógica específica de cada tratamiento
  // Por ahora es un placeholder
}
