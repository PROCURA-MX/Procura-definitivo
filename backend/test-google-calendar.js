const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testGoogleCalendar() {
  console.log('🧪 Probando sincronización de Google Calendar...\n');

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

    // 2. Verificar estado de Google Calendar
    console.log('2. 📅 Verificando estado de Google Calendar...');
    const statusResponse = await axios.get(`${BASE_URL}/api/google/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Estado de Google Calendar:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    console.log('');

    // 3. Si está conectado, probar crear una cita
    if (statusResponse.data.connected) {
      console.log('3. 📝 Probando creación de cita con sincronización...');
      
      // Obtener un paciente
      const pacientesResponse = await axios.get(`${BASE_URL}/api/pacientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (pacientesResponse.data.length > 0) {
        const paciente = pacientesResponse.data[0];
        console.log('Paciente seleccionado:', paciente.nombre, paciente.apellido);
        
        // Crear una cita para mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0); // 10:00 AM
        
        const citaData = {
          fecha_inicio: tomorrow.toISOString(),
          fecha_fin: new Date(tomorrow.getTime() + 30 * 60000).toISOString(), // +30 minutos
          descripcion: 'Cita de prueba para sincronización con Google Calendar',
          estado: 'PROGRAMADA',
          paciente_id: paciente.id,
          usuario_id: loginResponse.data.user.id,
          consultorio_id: loginResponse.data.user.consultorio_id
        };

        const citaResponse = await axios.post(`${BASE_URL}/api/citas`, citaData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Cita creada:');
        console.log(JSON.stringify(citaResponse.data, null, 2));
        console.log('');
        
        console.log('🔍 Verifica en Google Calendar si apareció la cita de prueba');
      } else {
        console.log('❌ No hay pacientes disponibles para crear la cita de prueba');
      }
    } else {
      console.log('❌ Usuario no tiene Google Calendar conectado');
      console.log('Para conectar Google Calendar:');
      console.log('1. Ve a la página de Usuarios');
      console.log('2. Busca la sección de Google Calendar Sync');
      console.log('3. Haz clic en "Conectar"');
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testGoogleCalendar(); 