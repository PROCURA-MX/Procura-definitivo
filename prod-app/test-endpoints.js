/**
 * ===========================================
 * SCRIPT DE PRUEBAS AUTOMATIZADAS
 * ===========================================
 * Ejecutar con: node test-endpoints.js
 * 
 * Este script valida todos los endpoints del backend
 * sin modificar la base de datos
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3002';
const API_BASE = `${BASE_URL}/api`;

// Configurar para desarrollo (ignorar certificados SSL)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Realiza una petición HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Ejecuta una prueba y muestra el resultado
 */
async function runTest(name, testFunction) {
  try {
    console.log(`\n🧪 Ejecutando: ${name}`);
    const result = await testFunction();
    if (result.success) {
      console.log(`✅ ${name}: ${result.message}`);
    } else {
      console.log(`❌ ${name}: ${result.message}`);
    }
    return result;
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Pruebas individuales
 */
const tests = {
  // Health check
  async healthCheck() {
    const response = await makeRequest(`${BASE_URL}/health`);
    return {
      success: response.statusCode === 200,
      message: `Status: ${response.statusCode}`
    };
  },

  // Login exitoso
  async loginSuccess() {
    const response = await makeRequest(`${API_BASE}/login`, {
      method: 'POST',
      body: { email: 'doctor@clinica.com', password: '123456' }
    });
    
    if (response.statusCode === 200 && response.data && response.data.token) {
      // Guardar token para pruebas posteriores
      global.testToken = response.data.token;
      return {
        success: true,
        message: `Login exitoso - Token obtenido`
      };
    }
    
    return {
      success: false,
      message: `Status: ${response.statusCode}, Data: ${JSON.stringify(response.data)}`
    };
  },

  // Login con credenciales incorrectas
  async loginFailure() {
    const response = await makeRequest(`${API_BASE}/login`, {
      method: 'POST',
      body: { email: 'doctor@clinica.com', password: 'wrongpassword' }
    });
    
    return {
      success: response.statusCode === 401,
      message: `Status: ${response.statusCode} (esperado: 401)`
    };
  },

  // Login con campos faltantes
  async loginMissingFields() {
    const response = await makeRequest(`${API_BASE}/login`, {
      method: 'POST',
      body: { email: 'doctor@clinica.com' }
    });
    
    return {
      success: response.statusCode === 400,
      message: `Status: ${response.statusCode} (esperado: 400)`
    };
  },

  // GET en login (debe fallar)
  async loginWrongMethod() {
    const response = await makeRequest(`${API_BASE}/login`, {
      method: 'GET'
    });
    
    return {
      success: response.statusCode === 404,
      message: `Status: ${response.statusCode} (esperado: 404)`
    };
  },

  // Usuarios sin token
  async usuariosWithoutToken() {
    const response = await makeRequest(`${API_BASE}/usuarios`);
    
    return {
      success: response.statusCode === 401,
      message: `Status: ${response.statusCode} (esperado: 401)`
    };
  },

  // Usuarios con token
  async usuariosWithToken() {
    if (!global.testToken) {
      return {
        success: false,
        message: 'No hay token disponible'
      };
    }

    const response = await makeRequest(`${API_BASE}/usuarios`, {
      headers: { Authorization: `Bearer ${global.testToken}` }
    });
    
    return {
      success: response.statusCode === 200,
      message: `Status: ${response.statusCode}`
    };
  },

  // Pacientes sin token
  async pacientesWithoutToken() {
    const response = await makeRequest(`${API_BASE}/pacientes`);
    
    return {
      success: response.statusCode === 401,
      message: `Status: ${response.statusCode} (esperado: 401)`
    };
  },

  // Pacientes con token
  async pacientesWithToken() {
    if (!global.testToken) {
      return {
        success: false,
        message: 'No hay token disponible'
      };
    }

    const response = await makeRequest(`${API_BASE}/pacientes`, {
      headers: { Authorization: `Bearer ${global.testToken}` }
    });
    
    return {
      success: response.statusCode === 200,
      message: `Status: ${response.statusCode}`
    };
  },

  // Cobros sin token
  async cobrosWithoutToken() {
    const response = await makeRequest(`${API_BASE}/cobros`);
    
    return {
      success: response.statusCode === 401,
      message: `Status: ${response.statusCode} (esperado: 401)`
    };
  },

  // Cobros con token
  async cobrosWithToken() {
    if (!global.testToken) {
      return {
        success: false,
        message: 'No hay token disponible'
      };
    }

    const response = await makeRequest(`${API_BASE}/cobros`, {
      headers: { Authorization: `Bearer ${global.testToken}` }
    });
    
    return {
      success: response.statusCode === 200,
      message: `Status: ${response.statusCode}`
    };
  }
};

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.log('🚀 Iniciando pruebas automatizadas del backend ProCura');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 API Base: ${API_BASE}`);
  
  const results = [];
  
  // Ejecutar pruebas en orden
  const testOrder = [
    'healthCheck',
    'loginSuccess',
    'loginFailure', 
    'loginMissingFields',
    'loginWrongMethod',
    'usuariosWithoutToken',
    'usuariosWithToken',
    'pacientesWithoutToken',
    'pacientesWithToken',
    'cobrosWithoutToken',
    'cobrosWithToken'
  ];

  for (const testName of testOrder) {
    const result = await runTest(testName, tests[testName]);
    results.push({ name: testName, ...result });
  }

  // Resumen final
  console.log('\n📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 Resultado: ${passed}/${total} pruebas pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡Todas las pruebas pasaron! El backend está listo.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa la configuración.');
  }
  
  return { passed, total, results };
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, tests };


