// Script de prueba para verificar el mapeo de consultorios a sedes
const axios = require('axios');

async function testMapping() {
  try {
    console.log('🔍 Probando mapeo de consultorios a sedes...');
    
    // Probar el endpoint del backend
    const response = await axios.get('http://localhost:3002/api/inventory/consultorios-sedes');
    console.log('✅ Backend response:', JSON.stringify(response.data, null, 2));
    
    // Probar el dashboard con diferentes sedeIds
    console.log('\n🔍 Probando dashboard con Consultorio Principal...');
    const dashboard1 = await axios.get('http://localhost:3002/api/dashboard/public?sedeId=ae72a3f3-ea9d-4f1c-aa58-cb012f714e21');
    console.log('✅ Consultorio Principal:', dashboard1.data.inventoryByCategory);
    
    console.log('\n🔍 Probando dashboard con Teca...');
    const dashboard2 = await axios.get('http://localhost:3002/api/dashboard/public?sedeId=sede-consultorio-teca-001');
    console.log('✅ Teca:', dashboard2.data.inventoryByCategory);
    
    console.log('\n🔍 Probando dashboard con sede-tecamachalco...');
    const dashboard3 = await axios.get('http://localhost:3002/api/dashboard/public?sedeId=sede-tecamachalco');
    console.log('✅ sede-tecamachalco:', dashboard3.data.inventoryByCategory);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMapping();

