const { WhatsAppService } = require('./dist/services/whatsappService')

async function testWhatsAppReminder() {
  console.log('🧪 Probando envío de recordatorio WhatsApp...')
  
  try {
    // Datos de prueba
    const testData = {
      citaId: 'test-cita-123',
      pacienteId: 'test-paciente-123',
      usuarioId: '66df11d1-33f9-4696-9683-af9169b55128', // Pablo Espinosa
      fecha: new Date('2025-07-26T15:00:00Z'),
      hora: '15:00',
      doctorNombre: 'Pablo Espinosa',
      consultorioNombre: 'coNSUL',
      pacienteTelefono: '+525551061892', // Tu número para pruebas
      pacienteNombre: 'Paciente de Prueba'
    }
    
    console.log('📤 Enviando recordatorio...')
    const result = await WhatsAppService.sendAppointmentReminder(testData)
    
    if (result.success) {
      console.log('✅ Recordatorio enviado exitosamente!')
      console.log('📱 Message ID:', result.messageId)
    } else {
      console.log('❌ Error enviando recordatorio:', result.error)
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error)
  }
}

// Ejecutar prueba
testWhatsAppReminder()
  .then(() => {
    console.log('🏁 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  }) 