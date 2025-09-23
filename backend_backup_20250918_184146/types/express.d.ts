/**
 * ===========================================
 * TIPOS ENTERPRISE PARA EXPRESS - PROCURA
 * ===========================================
 * 
 * Extensión de tipos de Express para el sistema ProCura
 * Siguiendo estándares enterprise de Amazon/Google
 */

import { Request } from 'express';

// ===========================================
// TIPOS DE AUTENTICACIÓN
// ===========================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizacion_id: string;
  consultorio_id: string;
  rol: string;
  nombre: string;
  apellido: string;
}

// ===========================================
// EXTENSIÓN DE REQUEST
// ===========================================

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// ===========================================
// TIPOS DE RESPUESTA API
// ===========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// TIPOS DE NOTIFICACIONES
// ===========================================

export interface NotificationRequest {
  pacienteNombre: string;
  pacienteEmail: string;
  pacienteTelefono?: string;
  usuarioId: string;
  pacienteId: string;
}

export interface AppointmentReminderRequest extends NotificationRequest {
  doctorNombre: string;
  consultorioNombre: string;
  fecha: Date;
  hora?: string;
  citaId: string;
}

export interface TreatmentReminderRequest extends NotificationRequest {
  treatmentType: string;
}

export interface PaymentNotificationRequest extends NotificationRequest {
  monto: number;
  concepto: string;
  fechaVencimiento?: Date;
  cobroId: string;
}

export interface NotificationResponse {
  success: boolean;
  method?: 'whatsapp' | 'email' | 'both' | 'none';
  whatsappMessageId?: string;
  emailMessageId?: string;
  error?: string;
}

// ===========================================
// TIPOS DE VALIDACIÓN
// ===========================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ===========================================
// TIPOS DE CONFIGURACIÓN
// ===========================================

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  maxConnections: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export interface WhatsAppConfig {
  apiUrl: string;
  token: string;
  phoneNumberId: string;
}

// ===========================================
// TIPOS DE LOGGING
// ===========================================

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

// ===========================================
// TIPOS DE MIDDLEWARE
// ===========================================

export interface MiddlewareConfig {
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  security: {
    helmet: boolean;
    csrf: boolean;
  };
}

// ===========================================
// TIPOS DE SERVICIOS
// ===========================================

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: Date;
  version: string;
}
