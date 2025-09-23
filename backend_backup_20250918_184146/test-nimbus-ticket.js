const axios = require('axios');

// Configuración de NimbusLabs
const NIMBUS_URL = 'https://testcfdi.nimbuslabs.mx/tickets';
const USERNAME = 'DemoTicket';
const PASSWORD = 'D3m0T1ck3t++';

// Generar folio único
const folio = `TICKET-${Date.now()}`;

// Ticket de prueba con formato exacto según especificación
const ticketData = {
  "Fecha": "28/08/2025 16:20",
  "MontoTicket": 25.00,
  "NumTicket": folio,
  "ClaveTienda": "E0005",
  "Conceptos": [
    {
      "ClaveSat": "90101501",
      "Descripcion": "Consulta Médica General",
      "Monto": 21.55,
      "ClaveUnidad": "E48",
      "Cantidad": 1,
      "PrecioUnitario": 21.55,
      "Importe": 21.55,
      "ImpuestosRetenidos": [],
      "ImpuestosTrasladados": [
        {
          "BaseImpuesto": 21.55,
          "Impuesto": "002",
          "TipoFactor": "Tasa",
          "TasaOCuota": 0.16,
          "Importe": 3.45
        }
      ]
    }
  ]
};

async function testTicketCreation() {
  try {
    console.log('🔐 Generando token de autenticación...');
    
    // Generar token de autenticación
    const loginResponse = await axios.post(`${NIMBUS_URL}/api/Login/Login`, {
      Usr: USERNAME,
      Pass: PASSWORD
    });

    console.log('📋 Respuesta de login:', loginResponse.data);

    if (!loginResponse.data) {
      console.error('❌ No se recibió token de autenticación');
      return;
    }

    const token = loginResponse.data;
    console.log('✅ Token generado:', token.substring(0, 20) + '...');

    console.log('🎫 Creando ticket...');
    console.log('📄 Datos del ticket:', JSON.stringify(ticketData, null, 2));

    // Crear ticket
    const ticketResponse = await axios.post(`${NIMBUS_URL}/api/Tickets/Ticket`, ticketData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const responseCode = ticketResponse.data;
    console.log('📊 Código de respuesta:', responseCode);
    
    if (responseCode === 1) {
      console.log('✅ Ticket creado exitosamente');
      console.log('📋 Folio:', folio);
      console.log('🔗 Portal:', 'https://testcfdi.nimbuslabs.mx/PortalNimbusDev/Login');
    } else {
      console.log('❌ Error al crear ticket. Código:', responseCode);
      console.log('📋 Folio generado:', folio);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

testTicketCreation();
