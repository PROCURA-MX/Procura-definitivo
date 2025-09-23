"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// Configuración de WhatsApp Business API
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
class WhatsAppService {
    /**
     * Envía recordatorio de cita con botones de confirmación/cancelación
     */
    static async sendAppointmentReminder(data) {
        try {
            const fecha = (0, date_fns_1.format)(data.fecha, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es });
            // Verificar si WhatsApp está configurado
            if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
                throw new Error('WhatsApp Business API no configurado');
            }
            // Crear mensaje con botones interactivos
            const messageBody = `Hola ${data.pacienteNombre}, tienes cita el ${fecha} con Dr. ${data.doctorNombre} en ${data.consultorioNombre}.

¿Confirmas tu asistencia?

ID de cita: ${data.citaId}`;
            // Enviar mensaje usando WhatsApp Business API
            const response = await axios_1.default.post(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                to: data.pacienteTelefono,
                type: 'text',
                text: {
                    body: messageBody
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            const messageId = response.data.messages?.[0]?.id;
            // Guardar en base de datos
            await prisma.whatsAppMessage.create({
                data: {
                    usuario_id: data.usuarioId,
                    paciente_id: data.pacienteId,
                    cita_id: data.citaId,
                    message_type: 'TEMPLATE',
                    content: {
                        body: messageBody,
                        appointmentId: data.citaId,
                        buttons: ['confirmar', 'cancelar', 'reagendar']
                    },
                    phone_number: data.pacienteTelefono,
                    status: 'SENT',
                    whatsapp_message_id: messageId,
                    sent_at: new Date()
                }
            });
            return {
                success: true,
                messageId: messageId
            };
        }
        catch (error) {
            console.error('Error enviando recordatorio WhatsApp:', error);
            // Guardar error en base de datos
            await prisma.whatsAppMessage.create({
                data: {
                    usuario_id: data.usuarioId,
                    paciente_id: data.pacienteId,
                    cita_id: data.citaId,
                    message_type: 'TEMPLATE',
                    content: {
                        body: 'Error al enviar mensaje',
                        appointmentId: data.citaId
                    },
                    phone_number: data.pacienteTelefono,
                    status: 'FAILED',
                    error_message: error instanceof Error ? error.message : 'Error desconocido',
                    sent_at: new Date()
                }
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Procesa respuesta del paciente (confirmar/cancelar)
     */
    static async processPatientResponse(phoneNumber, response, appointmentId) {
        try {
            const cita = await prisma.citas.findUnique({
                where: { id: appointmentId },
                include: {
                    pacientes: true,
                    usuarios: true,
                    consultorios: true
                }
            });
            if (!cita) {
                return {
                    success: false,
                    error: 'Cita no encontrada'
                };
            }
            const responseLower = response.toLowerCase();
            let newStatus;
            let confirmationMessage;
            if (responseLower.includes('confirmar') || responseLower.includes('si') || responseLower.includes('ok')) {
                newStatus = 'CONFIRMADA';
                confirmationMessage = `✅ Confirmado! Tu cita está confirmada para el ${(0, date_fns_1.format)(cita.fecha_inicio, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es })}. Te esperamos!`;
            }
            else if (responseLower.includes('cancelar') || responseLower.includes('no')) {
                newStatus = 'CANCELADA';
                confirmationMessage = `❌ Entendido, tu cita ha sido cancelada. Si necesitas reagendar, contáctanos.`;
            }
            else {
                return {
                    success: false,
                    error: 'Respuesta no reconocida'
                };
            }
            // Actualizar estado de la cita
            await prisma.citas.update({
                where: { id: appointmentId },
                data: { estado: newStatus }
            });
            // Verificar si WhatsApp está configurado
            if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
                throw new Error('WhatsApp Business API no configurado');
            }
            // Enviar confirmación al paciente
            await axios_1.default.post(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                    body: confirmationMessage
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            // Notificar al consultorio
            await this.notifyConsultorio(cita, newStatus);
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Error procesando respuesta del paciente:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Notifica al consultorio sobre confirmación/cancelación
     */
    static async notifyConsultorio(cita, status) {
        try {
            const statusText = status === 'CONFIRMADA' ? '✅ CONFIRMADA' : '❌ CANCELADA';
            const message = `Cita ${statusText}

Paciente: ${cita.pacientes.nombre} ${cita.pacientes.apellido}
Fecha: ${(0, date_fns_1.format)(cita.fecha_inicio, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es })}
Doctor: ${cita.usuarios.nombre} ${cita.usuarios.apellido}
Consultorio: ${cita.consultorios.nombre}`;
            // Aquí podrías enviar notificación al consultorio
            // Por ahora solo lo guardamos en logs
            console.log('Notificación al consultorio:', message);
        }
        catch (error) {
            console.error('Error notificando al consultorio:', error);
        }
    }
    /**
     * Envía recordatorio para tratamientos semanales
     */
    static async sendWeeklyTreatmentReminder(pacienteId, treatmentType, usuarioId) {
        try {
            const paciente = await prisma.paciente.findUnique({
                where: { id: pacienteId }
            });
            if (!paciente?.telefono) {
                return {
                    success: false,
                    error: 'Paciente sin teléfono'
                };
            }
            // Verificar si WhatsApp está configurado
            if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
                throw new Error('WhatsApp Business API no configurado');
            }
            const messageBody = `Hola ${paciente.nombre}, es momento de tu próxima ${treatmentType}.

Haz clic aquí para agendar tu cita: https://procura.com/agendar/${pacienteId}/${treatmentType}

O responde "AGENDAR" para que te contactemos.`;
            const response = await axios_1.default.post(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                to: paciente.telefono,
                type: 'text',
                text: {
                    body: messageBody
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                success: true,
                messageId: response.data.messages?.[0]?.id
            };
        }
        catch (error) {
            console.error('Error enviando recordatorio de tratamiento:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Envía recordatorio de tratamiento (alias para sendWeeklyTreatmentReminder)
     */
    static async sendTreatmentReminder(data) {
        return this.sendWeeklyTreatmentReminder(data.pacienteId || data.id, data.treatmentType || 'tratamiento', data.usuarioId || data.userId);
    }
    /**
     * Envía notificación de cobro
     */
    static async sendPaymentNotification(data) {
        try {
            // Verificar si WhatsApp está configurado
            if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
                throw new Error('WhatsApp Business API no configurado');
            }
            const messageBody = `Hola ${data.pacienteNombre}, tienes un cobro pendiente de $${data.monto} por concepto: ${data.concepto}.

${data.fechaVencimiento ? `Fecha de vencimiento: ${(0, date_fns_1.format)(data.fechaVencimiento, "dd/MM/yyyy")}` : ''}

Por favor, realiza el pago lo antes posible.

ID de cobro: ${data.cobroId}`;
            // Enviar mensaje usando WhatsApp Business API
            const response = await axios_1.default.post(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                messaging_product: 'whatsapp',
                to: data.pacienteTelefono,
                type: 'text',
                text: { body: messageBody }
            }, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Notificación de cobro enviada por WhatsApp:', response.data);
            return {
                success: true,
                messageId: response.data.messages?.[0]?.id
            };
        }
        catch (error) {
            console.error('Error enviando notificación de cobro:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Verifica si WhatsApp está disponible
     */
    static async isAvailable() {
        try {
            // Verificar si las variables de entorno están configuradas
            if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
                console.log('❌ WhatsApp no configurado: faltan variables de entorno');
                return false;
            }
            // Verificar conectividad con la API
            const response = await axios_1.default.get(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}`, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            });
            console.log('✅ WhatsApp disponible:', response.data);
            return true;
        }
        catch (error) {
            console.error('❌ WhatsApp no disponible:', error);
            return false;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
