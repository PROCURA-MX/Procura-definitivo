const axios = require('axios');

async function testProxy() {
  try {
    console.log('🧪 Probando proxy de Vite...');
    
    // Probar el proxy a través del frontend
    const response = await axios.get('http://localhost:5173/api/health');
    console.log('✅ Proxy funcionando:', response.data);
    
  } catch (error) {
    console.error('❌ Error con proxy:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testProxy();
