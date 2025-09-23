import express from 'express'
import { WhatsAppController } from '../controllers/whatsappController'

const router = express.Router()

// Verificación del webhook (requerido por Meta)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  
  console.log('Verificación de webhook:', { mode, token, challenge })
  
  // Verificar que el token coincida con el configurado en Meta
  if (mode === 'subscribe' && token === 'bravo_webhook_2024') {
    console.log('Webhook verificado correctamente')
    res.status(200).send(challenge)
  } else {
    console.log('Verificación fallida')
    res.status(403).send('Forbidden')
  }
})

// Webhook para recibir mensajes de WhatsApp
router.post('/webhook', WhatsAppController.handleWebhook)

// Enviar recordatorio de cita
router.post('/reminder/:citaId', WhatsAppController.sendReminder)

// Enviar recordatorio de tratamiento semanal
router.post('/treatment-reminder/:pacienteId/:treatmentType', WhatsAppController.sendTreatmentReminder)

export default router 