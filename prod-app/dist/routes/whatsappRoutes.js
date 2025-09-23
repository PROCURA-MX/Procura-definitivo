"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsappController_1 = require("../controllers/whatsappController");
const router = express_1.default.Router();
// Verificación del webhook (requerido por Meta)
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    console.log('Verificación de webhook:', { mode, token, challenge });
    // Verificar que el token coincida con el configurado en Meta
    if (mode === 'subscribe' && token === 'bravo_webhook_2024') {
        console.log('Webhook verificado correctamente');
        res.status(200).send(challenge);
    }
    else {
        console.log('Verificación fallida');
        res.status(403).send('Forbidden');
    }
});
// Webhook para recibir mensajes de WhatsApp
router.post('/webhook', whatsappController_1.WhatsAppController.handleWebhook);
// Enviar recordatorio de cita
router.post('/reminder/:citaId', whatsappController_1.WhatsAppController.sendReminder);
// Enviar recordatorio de tratamiento semanal
router.post('/treatment-reminder/:pacienteId/:treatmentType', whatsappController_1.WhatsAppController.sendTreatmentReminder);
exports.default = router;
