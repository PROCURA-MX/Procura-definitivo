const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testLoginAndFiltering() {
  console.log('🧪 Probando login y filtrado multi-tenant...');
  console.log('==========================================');
  
  const testUsers = [
    { email: 'dr.garcia@clinica.com', password: '123456', name: 'Dr. García' },
    { email: 'dr.martinez@clinica.com', password: '123456', name: 'Dr. Martínez' },
    { email: 'rodrigoespc03@gmail.com', password: '123456', name: 'Dr. Pablo' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n👨‍⚕️ Probando con ${user.name} (${user.email}):`);
    console.log('----------------------------------------');
    
    try {
      // 1. Login
      console.log('1️⃣ Intentando login...');
      const loginResponse = await axios.post(`${BASE_URL}/login`, {
        email: user.email,
        password: user.password
      });
      
      const { token, user: userData } = loginResponse.data;
      console.log(`✅ Login exitoso para ${userData.nombre} ${userData.apellido}`);
      console.log(`   Rol: ${userData.rol}`);
      console.log(`   Organización: ${userData.organizacion_id}`);
      
      // 2. Probar filtrado de usuarios
      console.log('2️⃣ Probando filtrado de usuarios...');
      const usuariosResponse = await axios.get(`${BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Usuarios encontrados: ${usuariosResponse.data.length}`);
      usuariosResponse.data.forEach(u => {
        console.log(`   - ${u.nombre} ${u.apellido} (${u.rol}) - ${u.consultorio_nombre || 'Sin consultorio'}`);
      });
      
      // 3. Probar filtrado de pacientes
      console.log('3️⃣ Probando filtrado de pacientes...');
      const pacientesResponse = await axios.get(`${BASE_URL}/pacientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Pacientes encontrados: ${pacientesResponse.data.length}`);
      
      // 4. Probar filtrado de servicios
      console.log('4️⃣ Probando filtrado de servicios...');
      const serviciosResponse = await axios.get(`${BASE_URL}/servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ Servicios encontrados: ${serviciosResponse.data.length}`);
      
    } catch (error) {
      console.log(`❌ Error con ${user.name}:`, error.response?.data?.error || error.message);
    }
  }
  
  console.log('\n🎉 Prueba completada!');
  console.log('Si ves diferentes datos para cada médico, el filtrado está funcionando correctamente.');
}

testLoginAndFiltering(); 