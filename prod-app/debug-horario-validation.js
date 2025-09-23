const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function debugHorarioValidation() {
  console.log('🔍 Debuggeando validación de horarios...\n');

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
    console.log('Dr. Rodrigo ID:', drRodrigo?.id);
    
    const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, {
      headers: { Authorization: `Bearer ${rodrigoToken}` }
    });
    
    // 3. Crear fecha para martes a las 8:00 PM
    const today = new Date();
    const daysUntilTuesday = (2 - today.getDay() + 7) % 7;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    nextTuesday.setHours(20, 0, 0, 0); // 8:00 PM
    
    console.log('\n📅 Fecha de la cita:', nextTuesday.toLocaleString());
    console.log('Día de la semana:', nextTuesday.getDay()); // 2 = martes
    
    // 4. Simular la validación manualmente
    console.log('\n🔍 Simulando validación manual...');
    
    // Horario disponible: 10:30 - 20:31
    const horaInicio = '10:30';
    const horaFin = '20:31';
    
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    
    const slotIni = new Date(nextTuesday);
    slotIni.setHours(hIni, mIni, 0, 0);
    
    const slotFin = new Date(nextTuesday);
    slotFin.setHours(hFin, mFin, 0, 0);
    
    const citaInicio = new Date(nextTuesday);
    const citaFin = new Date(nextTuesday.getTime() + 30 * 60 * 1000); // +30 minutos
    
    console.log('Horario disponible:', slotIni.toLocaleTimeString(), '-', slotFin.toLocaleTimeString());
    console.log('Cita propuesta:', citaInicio.toLocaleTimeString(), '-', citaFin.toLocaleTimeString());
    
    const dentro = citaInicio >= slotIni && citaFin <= slotFin;
    console.log('¿Dentro del horario?', dentro);
    
    // 5. Intentar crear la cita y ver los logs del servidor
    console.log('\n5️⃣ Intentando crear cita a las 8:00 PM...');
    
    const citaData = {
      fecha_inicio: nextTuesday.toISOString(),
      fecha_fin: citaFin.toISOString(),
      descripcion: 'Cita de debug a las 8:00 PM',
      estado: 'PROGRAMADA',
      paciente_id: pacientesResponse.data[0]?.id,
      usuario_id: drRodrigo?.id,
      consultorio_id: drRodrigo?.consultorio_id
    };
    
    try {
      const citaResponse = await axios.post(`${BASE_URL}/citas`, citaData, {
        headers: { Authorization: `Bearer ${rodrigoToken}` }
      });
      
      console.log('✅ Cita creada exitosamente:', citaResponse.data.id);
      console.log('❌ PROBLEMA: Se creó una cita que debería haber sido rechazada');
      
    } catch (error) {
      console.log('✅ CORRECTO: Cita rechazada');
      console.log('Error:', error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugHorarioValidation(); 