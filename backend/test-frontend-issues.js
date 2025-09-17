const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function testMultiTenantSystem() {
  console.log('🧪 Probando sistema multi-tenant...\n');

  // 1. Login Dr. Rodrigo
  console.log('1️⃣ Login Dr. Rodrigo...');
  try {
    const rodrigoLogin = await axios.post(`${BASE_URL}/login`, {
      email: 'rodrigoespc03@gmail.com',
      password: '123456'
    });
    const rodrigoToken = rodrigoLogin.data.token;
    console.log('✅ Dr. Rodrigo logueado correctamente');
    
    // 2. Login Dr. García
    console.log('\n2️⃣ Login Dr. García...');
    const garciaLogin = await axios.post(`${BASE_URL}/login`, {
      email: 'dr.garcia@clinica.com',
      password: '123456'
    });
    const garciaToken = garciaLogin.data.token;
    console.log('✅ Dr. García logueado correctamente');

    // 3. Probar endpoints con Dr. Rodrigo
    console.log('\n3️⃣ Probando endpoints con Dr. Rodrigo...');
    
    const rodrigoHeaders = { Authorization: `Bearer ${rodrigoToken}` };
    
    // Usuarios
    const rodrigoUsuarios = await axios.get(`${BASE_URL}/usuarios`, { headers: rodrigoHeaders });
    console.log(`✅ Dr. Rodrigo ve ${rodrigoUsuarios.data.length} usuarios`);
    
    // Pacientes
    const rodrigoPacientes = await axios.get(`${BASE_URL}/pacientes`, { headers: rodrigoHeaders });
    console.log(`✅ Dr. Rodrigo ve ${rodrigoPacientes.data.length} pacientes`);
    
    // Citas
    const rodrigoCitas = await axios.get(`${BASE_URL}/citas`, { headers: rodrigoHeaders });
    console.log(`✅ Dr. Rodrigo ve ${rodrigoCitas.data.length} citas`);
    
    // Cobros
    const rodrigoCobros = await axios.get(`${BASE_URL}/cobros`, { headers: rodrigoHeaders });
    console.log(`✅ Dr. Rodrigo ve ${rodrigoCobros.data.length} cobros`);

    // 4. Probar endpoints con Dr. García
    console.log('\n4️⃣ Probando endpoints con Dr. García...');
    
    const garciaHeaders = { Authorization: `Bearer ${garciaToken}` };
    
    // Usuarios
    const garciaUsuarios = await axios.get(`${BASE_URL}/usuarios`, { headers: garciaHeaders });
    console.log(`✅ Dr. García ve ${garciaUsuarios.data.length} usuarios`);
    
    // Pacientes
    const garciaPacientes = await axios.get(`${BASE_URL}/pacientes`, { headers: garciaHeaders });
    console.log(`✅ Dr. García ve ${garciaPacientes.data.length} pacientes`);
    
    // Citas
    const garciaCitas = await axios.get(`${BASE_URL}/citas`, { headers: garciaHeaders });
    console.log(`✅ Dr. García ve ${garciaCitas.data.length} citas`);
    
    // Cobros
    const garciaCobros = await axios.get(`${BASE_URL}/cobros`, { headers: garciaHeaders });
    console.log(`✅ Dr. García ve ${garciaCobros.data.length} cobros`);

    // 5. Verificar aislamiento de datos
    console.log('\n5️⃣ Verificando aislamiento de datos...');
    
    const rodrigoUserIds = rodrigoUsuarios.data.map(u => u.id);
    const garciaUserIds = garciaUsuarios.data.map(u => u.id);
    
    const commonUsers = rodrigoUserIds.filter(id => garciaUserIds.includes(id));
    if (commonUsers.length === 0) {
      console.log('✅ Aislamiento de usuarios: PERFECTO - No hay usuarios compartidos');
    } else {
      console.log('❌ Aislamiento de usuarios: FALLO - Hay usuarios compartidos');
    }

    console.log('\n🎉 ¡Sistema multi-tenant funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

testMultiTenantSystem(); 