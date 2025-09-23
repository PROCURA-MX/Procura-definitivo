const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testGoogleSync() {
  console.log('🧪 Probando sincronización con Google Calendar (token refrescado)...\n');

  try {
    // 1. Login como Dr. Rodrigo (Pablo Espinosa)
    console.log('1. 🔐 Login como Dr. Rodrigo (Pablo Espinosa)...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('Usuario:', loginResponse.data.user.nombre, loginResponse.data.user.apellido);
    console.log('Usuario ID:', loginResponse.data.user.id);
    console.log('');

    // 2. Verificar estado de Google Calendar (debería mostrar token válido ahora)
    console.log('2. 📅 Verificando estado de Google Calendar...');
    const statusResponse = await axios.get(`${BASE_URL}/api/google/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Estado de Google Calendar:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    console.log('');

    // 3. Obtener disponibilidad del médico para crear una cita válida
    console.log('3. 📋 Obteniendo disponibilidad del médico...');
    const disponibilidadResponse = await axios.get(`${BASE_URL}/api/disponibilidad-medico`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Disponibilidades encontradas:', disponibilidadResponse.data.length);
    disponibilidadResponse.data.forEach((d, index) => {
      console.log(`${index + 1}. Día ${d.dia_semana}: ${d.hora_inicio} - ${d.hora_fin}`);
    });
    console.log('');

    if (disponibilidadResponse.data.length === 0) {
      console.log('❌ No hay disponibilidades configuradas. Configura la disponibilidad del médico primero.');
      return;
    }

    // 4. Crear una cita en un horario válido
    console.log('4. 📝 Creando cita en horario válido...');
    
    // Obtener un paciente
    const pacientesResponse = await axios.get(`${BASE_URL}/api/pacientes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (pacientesResponse.data.length === 0) {
      console.log('❌ No hay pacientes disponibles');
      return;
    }

    const paciente = pacientesResponse.data[0];
    console.log('Paciente seleccionado:', paciente.nombre, paciente.apellido);
    
    // Usar la primera disponibilidad disponible
    const disponibilidad = disponibilidadResponse.data[0];
    console.log('Usando disponibilidad:', `Día ${disponibilidad.dia_semana}: ${disponibilidad.hora_inicio} - ${disponibilidad.hora_fin}`);
    
    // Crear fecha para el próximo día de la semana que coincida
    const today = new Date();
    const targetDay = disponibilidad.dia_semana;
    const currentDay = today.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    // Establecer la hora de inicio
    const [hora, minuto] = disponibilidad.hora_inicio.split(':').map(Number);
    targetDate.setHours(hora, minuto, 0, 0);
    
    // Crear fecha de fin (30 minutos después)
    const fechaFin = new Date(targetDate.getTime() + 30 * 60000);
    
    console.log('Fecha de cita:', targetDate.toLocaleString());
    console.log('Fecha de fin:', fechaFin.toLocaleString());
    console.log('');
    
    const citaData = {
      fecha_inicio: targetDate.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      descripcion: 'Cita de prueba para sincronización con Google Calendar (token refrescado)',
      estado: 'PROGRAMADA',
      paciente_id: paciente.id,
      usuario_id: loginResponse.data.user.id,
      consultorio_id: loginResponse.data.user.consultorio_id
    };

    const citaResponse = await axios.post(`${BASE_URL}/api/citas`, citaData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Cita creada exitosamente:');
    console.log('ID:', citaResponse.data.id);
    console.log('Paciente:', citaResponse.data.pacientes?.nombre, citaResponse.data.pacientes?.apellido);
    console.log('Fecha:', new Date(citaResponse.data.fecha_inicio).toLocaleString());
    console.log('Estado:', citaResponse.data.estado);
    console.log('');
    
    console.log('🔍 INSTRUCCIONES:');
    console.log('1. Ve a tu Google Calendar');
    console.log('2. Busca la fecha:', targetDate.toLocaleDateString());
    console.log('3. Deberías ver la cita: "Cita de prueba para sincronización con Google Calendar (token refrescado)"');
    console.log('4. Si aparece, la sincronización está funcionando correctamente');
    console.log('');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testGoogleSync(); 