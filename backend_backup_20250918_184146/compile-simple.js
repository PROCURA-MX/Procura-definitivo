const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Crear directorio dist si no existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Archivos principales del backend de cobros
const files = [
  'index.ts',
  'controllers/cobroController.ts',
  'controllers/pacienteController.ts',
  'controllers/usuarioController.ts',
  'controllers/consultorioController.ts',
  'controllers/servicioController.ts',
  'controllers/cobroConceptoController.ts',
  'controllers/historialCobroController.ts',
  'controllers/precioConsultorioController.ts',
  'controllers/citaController.ts',
  'controllers/disponibilidadMedicoController.ts',
  'controllers/bloqueoMedicoController.ts',
  'controllers/inventoryController.ts',
  'routes/cobroRoutes.ts',
  'routes/pacienteRoutes.ts',
  'routes/usuarioRoutes.ts',
  'routes/consultorioRoutes.ts',
  'routes/servicioRoutes.ts',
  'routes/cobroConceptoRoutes.ts',
  'routes/historialCobroRoutes.ts',
  'routes/precioConsultorioRoutes.ts',
  'routes/citaRoutes.ts',
  'routes/authRoutes.ts',
  'routes/googleAuthRoutes.ts',
  'routes/disponibilidadMedicoRoutes.ts',
  'routes/bloqueoMedicoRoutes.ts',
  'routes/inventoryRoutes.ts',
  'middleware/tenantMiddleware.ts',
  'utils/asyncHandler.ts',
  'services/googleCalendarService.ts',
  'services/inventoryService.ts'
];

console.log('Compilando backend de cobros...');

try {
  // Compilar cada archivo individualmente
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const outputFile = file.replace('.ts', '.js');
      const outputPath = path.join('dist', outputFile);
      
      // Crear directorio si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Compilar con tsc
      execSync(`npx tsc ${file} --outDir dist --target ES2020 --module commonjs --esModuleInterop --skipLibCheck --noEmitOnError false`, { stdio: 'inherit' });
      console.log(`✅ Compilado: ${file}`);
    } else {
      console.log(`⚠️  Archivo no encontrado: ${file}`);
    }
  });
  
  console.log('✅ Compilación completada');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  process.exit(1);
} 