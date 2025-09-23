import { WhatsAppService } from './whatsappService';
import { EmailService } from './emailService';
import type { 
  NotificationResponse,
  AppointmentReminderRequest,
  TreatmentReminderRequest,
  PaymentNotificationRequest
} from '../types/express';

// Alias para compatibilidad con el servicio existente
type AppointmentReminderData = AppointmentReminderRequest;
type TreatmentReminderData = TreatmentReminderRequest;
type PaymentNotificationData = PaymentNotificationRequest;

export class NotificationService {
  /**
   * Envía recordatorio de cita usando WhatsApp y/o Email
   * Prioriza WhatsApp, pero usa Email como fallback
   */
  static async sendAppointmentReminder(data: AppointmentReminderData): Promise<NotificationResponse> {
    const results: NotificationResponse = {
      success: false,
      method: 'email' // Por defecto usamos email
    };

    // Intentar WhatsApp primero (si está configurado)
    if (data.pacienteTelefono) {
      try {
        console.log('📱 Intentando enviar recordatorio por WhatsApp...');
        const whatsappResult = await WhatsAppService.sendAppointmentReminder({
          ...data,
          pacienteTelefono: data.pacienteTelefono,
          hora: data.hora || data.fecha.toTimeString().slice(0, 5) // Extraer hora del Date si no se proporciona
        });

        if (whatsappResult.success) {
          results.success = true;
          results.method = 'whatsapp';
          results.whatsappMessageId = whatsappResult.messageId;
          console.log('✅ Recordatorio enviado por WhatsApp');
          return results;
        } else {
          console.log('⚠️ WhatsApp falló, intentando Email...');
        }
      } catch (error) {
        console.error('❌ Error en WhatsApp:', error);
        console.log('⚠️ Intentando Email como fallback...');
      }
    }

    // Intentar Email como fallback
    if (data.pacienteEmail) {
      try {
        console.log('📧 Intentando enviar recordatorio por Email...');
        const emailResult = await EmailService.sendAppointmentReminder(data);

        if (emailResult.success) {
          results.success = true;
          if (results.method === 'whatsapp') {
            results.method = 'both'; // Ambos métodos funcionaron
          } else {
            results.method = 'email';
          }
          results.emailMessageId = emailResult.messageId;
          console.log('✅ Recordatorio enviado por Email');
        } else {
          results.error = emailResult.error || 'Error desconocido en Email';
          console.error('❌ Error en Email:', results.error);
        }
      } catch (error) {
        results.error = `Error en Email: ${error}`;
        console.error('❌ Error crítico en Email:', error);
      }
    } else {
      results.error = 'No se pudo enviar: falta teléfono y email del paciente';
      console.error('❌ Error: Paciente sin teléfono ni email');
    }

    return results;
  }

  /**
   * Envía recordatorio de tratamiento usando WhatsApp y/o Email
   */
  static async sendTreatmentReminder(data: TreatmentReminderData): Promise<NotificationResponse> {
    const results: NotificationResponse = {
      success: false,
      method: 'email' // Por defecto usamos email
    };

    // Intentar WhatsApp primero (si está configurado)
    if (data.pacienteTelefono) {
      try {
        console.log('📱 Intentando enviar recordatorio de tratamiento por WhatsApp...');
        const whatsappResult = await WhatsAppService.sendTreatmentReminder(data);

        if (whatsappResult.success) {
          results.success = true;
          results.method = 'whatsapp';
          results.whatsappMessageId = whatsappResult.messageId;
          console.log('✅ Recordatorio de tratamiento enviado por WhatsApp');
          return results;
        } else {
          console.log('⚠️ WhatsApp falló, intentando Email...');
        }
      } catch (error) {
        console.error('❌ Error en WhatsApp:', error);
        console.log('⚠️ Intentando Email como fallback...');
      }
    }

    // Intentar Email como fallback
    if (data.pacienteEmail) {
      try {
        console.log('📧 Intentando enviar recordatorio de tratamiento por Email...');
        const emailResult = await EmailService.sendTreatmentReminder(data);

        if (emailResult.success) {
          results.success = true;
          if (results.method === 'whatsapp') {
            results.method = 'both'; // Ambos métodos funcionaron
          } else {
            results.method = 'email';
          }
          results.emailMessageId = emailResult.messageId;
          console.log('✅ Recordatorio de tratamiento enviado por Email');
        } else {
          results.error = emailResult.error || 'Error desconocido en Email';
          console.error('❌ Error en Email:', results.error);
        }
      } catch (error) {
        results.error = `Error en Email: ${error}`;
        console.error('❌ Error crítico en Email:', error);
      }
    } else {
      results.error = 'No se pudo enviar: falta teléfono y email del paciente';
      console.error('❌ Error: Paciente sin teléfono ni email');
    }

    return results;
  }

  /**
   * Envía notificación de cobro usando WhatsApp y/o Email
   */
  static async sendPaymentNotification(data: PaymentNotificationData): Promise<NotificationResponse> {
    const results: NotificationResponse = {
      success: false,
      method: 'email' // Por defecto usamos email
    };

    // Intentar WhatsApp primero (si está configurado)
    if (data.pacienteTelefono) {
      try {
        console.log('📱 Intentando enviar notificación de cobro por WhatsApp...');
        const whatsappResult = await WhatsAppService.sendPaymentNotification(data);

        if (whatsappResult.success) {
          results.success = true;
          results.method = 'whatsapp';
          results.whatsappMessageId = whatsappResult.messageId;
          console.log('✅ Notificación de cobro enviada por WhatsApp');
          return results;
        } else {
          console.log('⚠️ WhatsApp falló, intentando Email...');
        }
      } catch (error) {
        console.error('❌ Error en WhatsApp:', error);
        console.log('⚠️ Intentando Email como fallback...');
      }
    }

    // Intentar Email como fallback
    if (data.pacienteEmail) {
      try {
        console.log('📧 Intentando enviar notificación de cobro por Email...');
        const emailResult = await EmailService.sendPaymentNotification(data);

        if (emailResult.success) {
          results.success = true;
          if (results.method === 'whatsapp') {
            results.method = 'both'; // Ambos métodos funcionaron
          } else {
            results.method = 'email';
          }
          results.emailMessageId = emailResult.messageId;
          console.log('✅ Notificación de cobro enviada por Email');
        } else {
          results.error = emailResult.error || 'Error desconocido en Email';
          console.error('❌ Error en Email:', results.error);
        }
      } catch (error) {
        results.error = `Error en Email: ${error}`;
        console.error('❌ Error crítico en Email:', error);
      }
    } else {
      results.error = 'No se pudo enviar: falta teléfono y email del paciente';
      console.error('❌ Error: Paciente sin teléfono ni email');
    }

    return results;
  }

  /**
   * Verifica qué métodos de notificación están disponibles
   */
  static async checkAvailableMethods(): Promise<{ whatsapp: boolean; email: boolean }> {
    const methods = {
      whatsapp: false,
      email: false
    };

    try {
      // Verificar WhatsApp
      const whatsappAvailable = await WhatsAppService.isAvailable();
      methods.whatsapp = whatsappAvailable;
      console.log(`📱 WhatsApp disponible: ${whatsappAvailable}`);
    } catch (error) {
      console.error('❌ Error verificando WhatsApp:', error);
    }

    try {
      // Verificar Email
      const emailAvailable = await EmailService.isAvailable();
      methods.email = emailAvailable;
      console.log(`📧 Email disponible: ${emailAvailable}`);
    } catch (error) {
      console.error('❌ Error verificando Email:', error);
    }

    return methods;
  }
}