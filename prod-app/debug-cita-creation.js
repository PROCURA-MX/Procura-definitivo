const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function debugCitaCreation() {
  console.log('🔍 Debuggeando creación de citas...\n');

  try {
    // 1. Login Dr. Rodrigo
    console.log('1️⃣ Login Dr. Rodrigo...');
    const rodrigoLogin = await axios.post(`${BASE_URL}/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    const rodrigoToken = rodrigoLogin.data.token;
    console.log('✅ Dr. Rodrigo logueado correctamente');
    console.log('Token:', rodrigoToken.substring(0, 50) + '...');
    
    // 2. Verificar datos del usuario logueado
    console.log('\n2️⃣ Verificando datos del usuario...');
    const userResponse = await axios.get(`${BASE_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    console.log('Usuarios del Dr. Rodrigo:', userResponse.data.length);
    
    // Encontrar al Dr. Rodrigo (no Ana)
    const drRodrigo = userResponse.data.find(u => u.rol === 'DOCTOR');
    console.log('Dr. Rodrigo encontrado:', drRodrigo?.nombre, drRodrigo?.organizacion_id);
    
    // 3. Verificar pacientes disponibles
    console.log('\n3️⃣ Verificando pacientes disponibles...');
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    console.log('Pacientes del Dr. Rodrigo:', pacientesResponse.data.length);
    if (pacientesResponse.data.length > 0) {
      console.log('Primer paciente:', pacientesResponse.data[0]?.nombre, pacientesResponse.data[0]?.organizacion_id);
    }
    
    // 4. Crear una cita el martes (día 2) a las 15:00 (dentro del horario 10:30-20:31)
    console.log('\n4️⃣ Intentando crear una cita el martes dentro del horario...');
    
    // Encontrar el próximo martes
    const today = new Date();
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    nextTuesday.setHours(15, 0, 0, 0); // 3:00 PM
    
    console.log('Hoy es:', today.toLocaleDateString(), 'día', today.getDay());
    console.log('Próximo martes:', nextTuesday.toLocaleDateString(), 'día', nextTuesday.getDay());
    
    const citaData = {
      fecha_inicio: nextTuesday.toISOString(),
      fecha_fin: new Date(nextTuesday.getTime() + 30 * 60 * 1000).toISOString(), // +30 minutos
      descripcion: 'Cita de prueba el martes',
      estado: 'PROGRAMADA',
      paciente_id: pacientesResponse.data[0]?.id,
      usuario_id: drRodrigo?.id,
      consultorio_id: drRodrigo?.consultorio_id
    };
    
    console.log('Datos de la cita:', JSON.stringify(citaData, null, 2));
    console.log('Fecha de inicio:', new Date(citaData.fecha_inicio).toLocaleString());
    
    const citaResponse = await axios.post(`${BASE_URL}/citas`, citaData, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    
    console.log('✅ Cita creada exitosamente:', citaResponse.data.id);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      console.error('Error detallado:', error.response.data.error);
    }
  }
}

debugCitaCreation(); 