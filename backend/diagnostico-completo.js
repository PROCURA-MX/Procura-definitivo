const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
  console.log('='.repeat(60));
  
  const resultados = {
    frontend: false,
    backend: false,
    database: false,
    proxy: false,
    urls: []
  };

  try {
    // 1. VERIFICAR FRONTEND
    console.log('\n1. 🔍 VERIFICANDO FRONTEND...');
    try {
      const frontendResponse = await axios.get('http://localhost:5173', { timeout: 5000 });
      console.log('✅ Frontend funcionando en puerto 5173');
      resultados.frontend = true;
    } catch (error) {
      console.log('❌ Frontend no responde en puerto 5173');
      console.log('   Error:', error.message);
    }

    // 2. VERIFICAR BACKEND
    console.log('\n2. 🔍 VERIFICANDO BACKEND...');
    try {
      const backendResponse = await axios.get('http://localhost:3002/health', { timeout: 5000 });
      console.log('✅ Backend funcionando en puerto 3002');
      console.log('   Status:', backendResponse.data.status);
      resultados.backend = true;
    } catch (error) {
      console.log('❌ Backend no responde en puerto 3002');
      console.log('   Error:', error.message);
    }

    // 3. VERIFICAR PROXY DEL FRONTEND
    console.log('\n3. 🔍 VERIFICANDO PROXY DEL FRONTEND...');
    try {
      const proxyResponse = await axios.get('http://localhost:5173/api/health', { timeout: 5000 });
      console.log('✅ Proxy del frontend funcionando');
      console.log('   Respuesta:', proxyResponse.data);
      resultados.proxy = true;
    } catch (error) {
      console.log('❌ Proxy del frontend no funciona');
      console.log('   Error:', error.message);
      console.log('   Status:', error.response?.status);
    }

    // 4. VERIFICAR PROCESOS ACTIVOS
    console.log('\n4. 🔍 VERIFICANDO PROCESOS ACTIVOS...');
    try {
      const { stdout: processes } = await execAsync('ps aux | grep -E "node|vite" | grep -v grep');
      console.log('📋 Procesos activos:');
      console.log(processes);
    } catch (error) {
      console.log('❌ Error verificando procesos:', error.message);
    }

    // 5. VERIFICAR PUERTOS EN USO
    console.log('\n5. 🔍 VERIFICANDO PUERTOS EN USO...');
    try {
      const { stdout: ports } = await execAsync('lsof -i :3002 -i :5173');
      console.log('📋 Puertos en uso:');
      console.log(ports);
    } catch (error) {
      console.log('❌ Error verificando puertos:', error.message);
    }

    // 6. TEST DE URLS ESPECÍFICAS
    console.log('\n6. 🔍 TEST DE URLS ESPECÍFICAS...');
    
    const urlsToTest = [
      'http://localhost:3002/health',
      'http://localhost:3002/api/inventory/products',
      'http://localhost:5173/api/health',
      'http://localhost:5173/api/inventory/products'
    ];

    for (const url of urlsToTest) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        console.log(`✅ ${url} - Status: ${response.status}`);
        resultados.urls.push({ url, status: 'OK', code: response.status });
      } catch (error) {
        console.log(`❌ ${url} - Error: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Data: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
        }
        resultados.urls.push({ url, status: 'ERROR', code: error.response?.status || 'NO_RESPONSE' });
      }
    }

    // 7. VERIFICAR CONFIGURACIÓN DE VITE
    console.log('\n7. 🔍 VERIFICANDO CONFIGURACIÓN DE VITE...');
    try {
      const { stdout: viteConfig } = await execAsync('cat ../frontend/vite.config.ts');
      console.log('📋 Configuración de Vite:');
      console.log(viteConfig);
    } catch (error) {
      console.log('❌ Error leyendo configuración de Vite:', error.message);
    }

    // 8. VERIFICAR LOGS DEL BACKEND
    console.log('\n8. 🔍 VERIFICANDO LOGS DEL BACKEND...');
    try {
      const { stdout: backendLogs } = await execAsync('tail -20 backend.log 2>/dev/null || echo "No hay logs del backend"');
      console.log('📋 Últimas líneas del log del backend:');
      console.log(backendLogs);
    } catch (error) {
      console.log('❌ Error leyendo logs del backend:', error.message);
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));
    
    console.log(`Frontend (5173): ${resultados.frontend ? '✅ FUNCIONANDO' : '❌ NO FUNCIONA'}`);
    console.log(`Backend (3002): ${resultados.backend ? '✅ FUNCIONANDO' : '❌ NO FUNCIONA'}`);
    console.log(`Proxy: ${resultados.proxy ? '✅ FUNCIONANDO' : '❌ NO FUNCIONA'}`);
    
    console.log('\n📋 URLs probadas:');
    resultados.urls.forEach(({ url, status, code }) => {
      const icon = status === 'OK' ? '✅' : '❌';
      console.log(`${icon} ${url} - ${status} (${code})`);
    });

    // RECOMENDACIONES
    console.log('\n💡 RECOMENDACIONES:');
    
    if (!resultados.backend) {
      console.log('1. 🚨 EL BACKEND NO ESTÁ CORRIENDO');
      console.log('   Ejecuta: ./restart-backend-definitive.sh');
    }
    
    if (!resultados.frontend) {
      console.log('2. 🚨 EL FRONTEND NO ESTÁ CORRIENDO');
      console.log('   Ejecuta: cd ../frontend && npm run dev');
    }
    
    if (!resultados.proxy && resultados.frontend && resultados.backend) {
      console.log('3. 🚨 EL PROXY NO FUNCIONA');
      console.log('   Reinicia el frontend: cd ../frontend && npm run dev');
    }

    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Reinicia el backend: ./restart-backend-definitive.sh');
    console.log('2. Reinicia el frontend: cd ../frontend && npm run dev');
    console.log('3. Limpia el caché del navegador (Ctrl+F5)');
    console.log('4. Prueba nuevamente las entradas de inventario');

  } catch (error) {
    console.error('❌ ERROR EN DIAGNÓSTICO:', error.message);
  }
}

diagnosticoCompleto();























