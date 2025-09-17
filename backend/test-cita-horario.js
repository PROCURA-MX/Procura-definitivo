const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testCitaHorario() {
  console.log('🕐 Probando cita dentro del horario...\n');

  try {
    // 1. Login Dr. Rodrigo
    console.log('1️⃣ Login Dr. Rodrigo...');
    const rodrigoLogin = await axios.post(`${BASE_URL}/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    const rodrigoToken = rodrigoLogin.data.token;
    console.log('✅ Dr. Rodrigo logueado correctamente');
    
    // 2. Obtener datos necesarios
    const userResponse = await axios.get(`${BASE_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    const drRodrigo = userResponse.data.find(u => u.rol === 'DOCTOR');
    
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    
    // 3. Crear cita a las 7:00 PM (dentro del horario 10:30-20:31)
    console.log('\n3️⃣ Creando cita a las 7:00 PM...');
    
    const today = new Date();
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    nextTuesday.setHours(19, 0, 0, 0); // 7:00 PM
    
    const citaData = {
      fecha_inicio: nextTuesday.toISOString(),
      fecha_fin: new Date(nextTuesday.getTime() + 30 * 60 * 1000).toISOString(), // +30 minutos
      descripcion: 'Cita a las 7:00 PM - dentro del horario',
      estado: 'PROGRAMADA',
      paciente_id: pacientesResponse.data[0]?.id,
      usuario_id: drRodrigo?.id,
      consultorio_id: drRodrigo?.consultorio_id
    };
    
    console.log('Horario disponible: 10:30 AM - 8:31 PM');
    console.log('Cita programada: 7:00 PM - 7:30 PM');
    console.log('Fecha:', new Date(citaData.fecha_inicio).toLocaleString());
    
    const citaResponse = await axios.post(`${BASE_URL}/citas`, citaData, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    
    console.log('✅ Cita creada exitosamente:', citaResponse.data.id);
    
    // 4. Probar cita a las 8:00 PM (fuera del horario)
    console.log('\n4️⃣ Intentando cita a las 8:00 PM (fuera del horario)...');
    
    const citaData2 = {
      fecha_inicio: new Date(nextTuesday.getTime() + 60 * 60 * 1000).toISOString(), // 8:00 PM
      fecha_fin: new Date(nextTuesday.getTime() + 90 * 60 * 1000).toISOString(), // 8:30 PM
      descripcion: 'Cita a las 8:00 PM - fuera del horario',
      estado: 'PROGRAMADA',
      paciente_id: pacientesResponse.data[0]?.id,
      usuario_id: drRodrigo?.id,
      consultorio_id: drRodrigo?.consultorio_id
    };
    
    try {
      const citaResponse2 = await axios.post(`${BASE_URL}/citas`, citaData2, {
        headers: { Authorization: `Bearer ${rodrigoToken}` }
      });
      console.log('❌ ERROR: Se creó una cita que debería haber sido rechazada');
    } catch (error) {
      console.log('✅ CORRECTO: Cita rechazada por estar fuera del horario');
      console.log('Error:', error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCitaHorario(); 