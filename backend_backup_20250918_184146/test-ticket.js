const axios = require('axios');

// Configuración de NimbusLabs - URL del Swagger que me compartiste
const NIMBUS_URL = 'https://testcfdi.nimbuslabs.mx/tickets';
const USERNAME = 'DemoTicket';
const PASSWORD = 'D3m0T1ck3t++';

// Ticket de prueba simple con formato de fecha ISO
const ticketData = {
  "Fecha": new Date().toISOString(),
  "MontoTicket": 24.90,
  "NumTicket": "TICKET-" + Date.now(),
  "ClaveTienda": "E0005",
  "Conceptos": [
    {
      "ClaveSat": "90101501",
      "Descripcion": "Agua Purificada Gerber, 4 l",
      "Monto": 21.47,
      "ClaveUnidad": "E48",
      "Cantidad": 1.00,
      "PrecioUnitario": 21.47,
      "Importe": 21.47,
      "ImpuestosRetenidos": [],
      "ImpuestosTrasladados": [
        {
          "BaseImpuesto": 21.47,
          "Impuesto": "002",
          "TipoFactor": "Tasa",
          "TasaOCuota": 0.16,
          "Importe": 3.43
        }
      ]
    }
  ]
};

async function testTicketCreation() {
  try {
    console.log('🚀 Iniciando prueba de creación de ticket...');
    console.log('📋 Datos del ticket:', JSON.stringify(ticketData, null, 2));
    console.log('🌐 URL base:', NIMBUS_URL);
    
    // Verificar totales
    const subtotal = ticketData.Conceptos.reduce((sum, concepto) => sum + concepto.Importe, 0);
    const iva = ticketData.Conceptos.reduce((sum, concepto) => {
      return sum + concepto.ImpuestosTrasladados.reduce((ivaSum, impuesto) => ivaSum + impuesto.Importe, 0);
    }, 0);
    const total = subtotal + iva;
    
    console.log('🧮 Verificación de totales:');
    console.log('  - Subtotal:', subtotal);
    console.log('  - IVA:', iva);
    console.log('  - Total calculado:', total);
    console.log('  - MontoTicket:', ticketData.MontoTicket);
    console.log('  - ¿Coinciden?:', Math.abs(total - ticketData.MontoTicket) < 0.01 ? '✅' : '❌');
    
    // Paso 1: Autenticación
    console.log('\n🔐 Paso 1: Autenticando con NimbusLabs...');
    const loginResponse = await axios.post(`${NIMBUS_URL}/api/Login/Login`, {
      Usr: USERNAME,
      Pass: PASSWORD
    });
    
    console.log('✅ Login exitoso - Token recibido');
    // El token viene directamente en el cuerpo de la respuesta
    const token = loginResponse.data;
    
    if (!token || typeof token !== 'string') {
      throw new Error('No se recibió token de autenticación válido');
    }
    
    console.log('🔑 Token JWT recibido (primeros 50 caracteres):', token.substring(0, 50) + '...');
    
    // Paso 2: Crear ticket
    console.log('\n🎫 Paso 2: Creando ticket...');
    const ticketResponse = await axios.post(`${NIMBUS_URL}/api/Tickets/Ticket`, ticketData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Ticket creado exitosamente:', ticketResponse.data);
    
    // Interpretar el código de respuesta según la documentación
    const responseCode = ticketResponse.data.code || ticketResponse.data;
    console.log('\n📊 Código de respuesta:', responseCode);
    
    switch (responseCode) {
      case 1:
        console.log('✅ Éxito: Ticket guardado correctamente');
        break;
      case -1:
        console.log('⚠️ Ticket duplicado');
        break;
      case -2:
        console.log('❌ Error al guardar');
        break;
      case -3:
        console.log('❌ Desajuste en totales');
        break;
      default:
        console.log('❓ Código de respuesta desconocido');
    }
    
    // Paso 3: Intentar obtener el folio consultando el ticket
    if (responseCode === 1) {
      console.log('\n🔍 Paso 3: Intentando obtener el folio...');
      
      try {
        // Intentar consultar el ticket por su NumTicket
        const consultaResponse = await axios.get(`${NIMBUS_URL}/api/Tickets/Ticket/${ticketData.NumTicket}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📄 Respuesta de consulta:', consultaResponse.data);
        
      } catch (consultaError) {
        console.log('⚠️ No se pudo consultar el ticket directamente:', consultaError.message);
        
        // Intentar listar tickets recientes
        try {
          console.log('\n📋 Intentando listar tickets recientes...');
          const listResponse = await axios.get(`${NIMBUS_URL}/api/Tickets/Tickets`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('📋 Lista de tickets:', listResponse.data);
          
        } catch (listError) {
          console.log('⚠️ No se pudo listar tickets:', listError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('📄 Respuesta del servidor:', error.response.data);
      console.error('📊 Status:', error.response.status);
      console.error('🌐 URL intentada:', error.config?.url);
    }
  }
}

// Ejecutar la prueba
testTicketCreation();
