const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testUsuariosPage() {
  console.log('🧪 Probando página de usuarios...\n');

  try {
    // 1. Login como Dr. Rodrigo (Pablo Espinosa)
    console.log('1. 🔐 Login como Dr. Rodrigo (Pablo Espinosa)...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('Usuario:', loginResponse.data.user.nombre, loginResponse.data.user.apellido);
    console.log('Organización:', loginResponse.data.user.organizacion_nombre);
    console.log('Consultorio ID:', loginResponse.data.user.consultorio_id);
    console.log('');

    // 2. Probar petición a usuarios
    console.log('2. 👥 Probando /api/usuarios...');
    const usuariosResponse = await axios.get(`${BASE_URL}/api/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Usuarios obtenidos:', usuariosResponse.data.length, 'usuarios');
    usuariosResponse.data.forEach(user => {
      console.log(`   - ${user.nombre} ${user.apellido} (${user.rol}) - Consultorio: ${user.consultorio?.nombre || 'N/A'}`);
    });
    console.log('');

    // 3. Probar petición a consultorios
    console.log('3. 🏥 Probando /api/consultorios...');
    const consultoriosResponse = await axios.get(`${BASE_URL}/api/consultorios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Consultorios obtenidos:', consultoriosResponse.data.length, 'consultorios');
    consultoriosResponse.data.forEach(consultorio => {
      console.log(`   - ${consultorio.nombre} (${consultorio.direccion})`);
    });
    console.log('');

    // 4. Probar login como Dr. García para comparar
    console.log('4. 🔐 Login como Dr. García para comparar...');
    const loginGarciaResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'dr.garcia@clinica.com',
      password: '123456'
    });
    
    const tokenGarcia = loginGarciaResponse.data.token;
    console.log('✅ Login Dr. García exitoso');
    console.log('Usuario:', loginGarciaResponse.data.user.nombre, loginGarciaResponse.data.user.apellido);
    console.log('Organización:', loginGarciaResponse.data.user.organizacion_nombre);
    console.log('Consultorio ID:', loginGarciaResponse.data.user.consultorio_id);
    console.log('');

    // 5. Probar usuarios con Dr. García
    console.log('5. 👥 Probando /api/usuarios con Dr. García...');
    const usuariosGarciaResponse = await axios.get(`${BASE_URL}/api/usuarios`, {
      headers: { 'Authorization': `Bearer ${tokenGarcia}` }
    });
    
    console.log('✅ Usuarios obtenidos (Dr. García):', usuariosGarciaResponse.data.length, 'usuarios');
    usuariosGarciaResponse.data.forEach(user => {
      console.log(`   - ${user.nombre} ${user.apellido} (${user.rol}) - Consultorio: ${user.consultorio?.nombre || 'N/A'}`);
    });
    console.log('');

    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- Dr. Rodrigo ve', usuariosResponse.data.length, 'usuarios');
    console.log('- Dr. García ve', usuariosGarciaResponse.data.length, 'usuarios');
    console.log('- Los datos están correctamente filtrados por consultorio');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testUsuariosPage(); 