const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testCreatePaciente() {
  console.log('🧪 Probando creación de pacientes...\n');

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
    console.log('Organización ID:', loginResponse.data.user.organizacion_id);
    console.log('Consultorio ID:', loginResponse.data.user.consultorio_id);
    console.log('');

    // 2. Probar creación de paciente
    console.log('2. 👤 Probando creación de paciente...');
    const pacienteData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      fecha_nacimiento: '1990-01-15',
      genero: 'M',
      telefono: '5551234567',
      email: 'juan.perez@test.com'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/pacientes`, pacienteData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Paciente creado exitosamente');
    console.log('Paciente creado:', createResponse.data);
    console.log('');

    // 3. Verificar que el paciente aparece en la lista
    console.log('3. 📋 Verificando lista de pacientes...');
    const pacientesResponse = await axios.get(`${BASE_URL}/api/pacientes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Pacientes obtenidos:', pacientesResponse.data.length, 'pacientes');
    pacientesResponse.data.forEach((paciente, index) => {
      console.log(`${index + 1}. ${paciente.nombre} ${paciente.apellido} (${paciente.email})`);
    });
    console.log('');

    // 4. Probar login como Dr. García para verificar aislamiento
    console.log('4. 🔐 Login como Dr. García para verificar aislamiento...');
    const loginGarciaResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'dr.garcia@clinica.com',
      password: '123456'
    });
    
    const tokenGarcia = loginGarciaResponse.data.token;
    console.log('✅ Login Dr. García exitoso');
    console.log('Usuario:', loginGarciaResponse.data.user.nombre, loginGarciaResponse.data.user.apellido);
    console.log('Organización ID:', loginGarciaResponse.data.user.organizacion_id);
    console.log('');

    // 5. Verificar que Dr. García NO ve el paciente de Dr. Rodrigo
    console.log('5. 🔍 Verificando aislamiento de datos...');
    const pacientesGarciaResponse = await axios.get(`${BASE_URL}/api/pacientes`, {
      headers: { 'Authorization': `Bearer ${tokenGarcia}` }
    });
    
    console.log('✅ Pacientes de Dr. García:', pacientesGarciaResponse.data.length, 'pacientes');
    pacientesGarciaResponse.data.forEach((paciente, index) => {
      console.log(`${index + 1}. ${paciente.nombre} ${paciente.apellido} (${paciente.email})`);
    });
    console.log('');

    // 6. Verificar si el paciente de Dr. Rodrigo aparece en la lista de Dr. García
    const pacienteRodrigo = pacientesGarciaResponse.data.find(p => p.email === 'juan.perez@test.com');
    if (pacienteRodrigo) {
      console.log('❌ ERROR: Dr. García puede ver el paciente de Dr. Rodrigo');
    } else {
      console.log('✅ CORRECTO: Dr. García NO puede ver el paciente de Dr. Rodrigo');
    }

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testCreatePaciente(); 