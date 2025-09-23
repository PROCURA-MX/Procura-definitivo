// Script para verificar el JWT_SECRET del backend
require('dotenv').config();

console.log('🔍 Verificando JWT_SECRET del backend...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : 'No definido');
console.log('Valor:', process.env.JWT_SECRET || 'fallback_secret');

// Generar un token con el mismo secret que usa el backend
const jwt = require('jsonwebtoken');

const testUser = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  email: 'doctor@clinica.com',
  rol: 'DOCTOR',
  organizacion_id: '550e8400-e29b-41d4-a716-446655440000',
  consultorio_id: '660e8400-e29b-41d4-a716-446655440000'
};

const secret = process.env.JWT_SECRET || 'fallback_secret';
const token = jwt.sign(testUser, secret, { expiresIn: '24h' });

console.log('\n🔑 Token generado con el secret correcto:');
console.log(token);
