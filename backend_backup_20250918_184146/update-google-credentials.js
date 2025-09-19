#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Credenciales de Google Calendar del usuario
const GOOGLE_CLIENT_ID = '1092321886751-u5lpb3hg2q6ikaf9bcdt71qbr7ab5fi3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

console.log('🔧 Actualizando credenciales de Google Calendar...');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ No se encontró el archivo .env');
  process.exit(1);
}

// Leer el archivo .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Actualizar las credenciales
envContent = envContent.replace(
  /GOOGLE_CLIENT_ID=.*/,
  `GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}`
);
envContent = envContent.replace(
  /GOOGLE_CLIENT_SECRET=.*/,
  `GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}`
);
envContent = envContent.replace(
  /GOOGLE_REDIRECT_URI=.*/,
  `GOOGLE_REDIRECT_URI=http://localhost:3002/api/google/oauth-callback`
);

// Escribir el archivo actualizado
fs.writeFileSync(envPath, envContent);

console.log('✅ Credenciales de Google Calendar actualizadas exitosamente!');
console.log('==========================================');
console.log(`📋 Client ID: ${GOOGLE_CLIENT_ID}`);
console.log(`🔐 Client Secret: ${GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);
console.log(`🔗 Redirect URI: http://localhost:3002/api/google/oauth-callback`);
console.log('');
console.log('🚀 ¡Listo para probar! Reinicia el backend con: npm run dev');

