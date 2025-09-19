#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGoogleCalendar() {
  console.log('🚀 Configuración de Google Calendar para ProCura');
  console.log('================================================\n');

  // Verificar si existe el archivo .env
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');

  if (!fs.existsSync(envPath)) {
    console.log('📝 Creando archivo .env desde env.example...');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Archivo .env creado exitosamente\n');
    } else {
      console.log('❌ No se encontró env.example');
      process.exit(1);
    }
  }

  // Leer el archivo .env actual
  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log('🔧 Configuración de Google Calendar');
  console.log('====================================\n');

  console.log('Para obtener las credenciales de Google:');
  console.log('1. Ve a: https://console.cloud.google.com/');
  console.log('2. Crea o selecciona un proyecto');
  console.log('3. Habilita la API de Google Calendar');
  console.log('4. Crea credenciales OAuth2');
  console.log('5. Agrega URI de redirección: http://localhost:3002/api/google/oauth-callback\n');

  // Solicitar credenciales
  const clientId = await question('📋 Ingresa tu Google Client ID: ');
  const clientSecret = await question('🔐 Ingresa tu Google Client Secret: ');

  if (!clientId || !clientSecret) {
    console.log('❌ Las credenciales son requeridas');
    process.exit(1);
  }

  // Actualizar el archivo .env
  envContent = envContent.replace(
    /GOOGLE_CLIENT_ID=.*/,
    `GOOGLE_CLIENT_ID=${clientId}`
  );
  envContent = envContent.replace(
    /GOOGLE_CLIENT_SECRET=.*/,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`
  );
  envContent = envContent.replace(
    /GOOGLE_REDIRECT_URI=.*/,
    `GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback`
  );

  // Escribir el archivo actualizado
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuración completada exitosamente!');
  console.log('==========================================\n');

  console.log('📋 Variables configuradas:');
  console.log(`   GOOGLE_CLIENT_ID: ${clientId}`);
  console.log(`   GOOGLE_CLIENT_SECRET: ${clientSecret.substring(0, 10)}...`);
  console.log(`   GOOGLE_REDIRECT_URI: http://localhost:3002/api/google/oauth-callback\n`);

  console.log('🚀 Próximos pasos:');
  console.log('1. Reinicia el backend: npm run dev');
  console.log('2. Prueba el endpoint: curl http://localhost:3002/api/google/oauth-init');
  console.log('3. Verifica la conexión en el frontend\n');

  console.log('📚 Documentación completa en: google-calendar-setup.md');

  rl.close();
}

// Ejecutar la configuración
setupGoogleCalendar().catch(console.error);
















