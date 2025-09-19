const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testCreateServicio() {
  console.log('🧪 Probando creación de servicios...\n');

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
    console.log('');

    // 2. Probar creación de servicio
    console.log('2. 🏥 Probando creación de servicio...');
    const servicioData = {
      nombre: 'Consulta General',
      precio_base: 500.00
    };

    const createResponse = await axios.post(`${BASE_URL}/api/servicios`, servicioData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Servicio creado exitosamente');
    console.log('Servicio creado:', createResponse.data);
    console.log('');

    // 3. Verificar que el servicio aparece en la lista
    console.log('3. 📋 Verificando lista de servicios...');
    const serviciosResponse = await axios.get(`${BASE_URL}/api/servicios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Servicios obtenidos:', serviciosResponse.data.length, 'servicios');
    serviciosResponse.data.forEach((servicio, index) => {
      console.log(`${index + 1}. ${servicio.nombre} - $${servicio.precio_base}`);
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

    // 5. Verificar que Dr. García NO ve el servicio de Dr. Rodrigo
    console.log('5. 🔍 Verificando aislamiento de datos...');
    const serviciosGarciaResponse = await axios.get(`${BASE_URL}/api/servicios`, {
      headers: { 'Authorization': `Bearer ${tokenGarcia}` }
    });
    
    console.log('✅ Servicios de Dr. García:', serviciosGarciaResponse.data.length, 'servicios');
    serviciosGarciaResponse.data.forEach((servicio, index) => {
      console.log(`${index + 1}. ${servicio.nombre} - $${servicio.precio_base}`);
    });
    console.log('');

    // 6. Verificar si el servicio de Dr. Rodrigo aparece en la lista de Dr. García
    const servicioRodrigo = serviciosGarciaResponse.data.find(s => s.nombre === 'Consulta General');
    if (servicioRodrigo) {
      console.log('❌ ERROR: Dr. García puede ver el servicio de Dr. Rodrigo');
    } else {
      console.log('✅ CORRECTO: Dr. García NO puede ver el servicio de Dr. Rodrigo');
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

testCreateServicio(); 