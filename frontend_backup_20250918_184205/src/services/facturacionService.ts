// Servicio para integración con proveedor de facturación

export interface FacturacionConfig {
  portalUrl: string;
  apiKey: string;
  clientId: string;
  webhookUrl: string;
}

export interface FacturaData {
  pacienteId: string;
  pacienteNombre: string;
  pacienteRfc?: string;
  monto: number;
  concepto: string;
  fecha: string;
  metodoPago?: string;
}

export interface TicketResponse {
  success: boolean;
  codigo: number;
  message: string;
  data?: any;
  metadata?: {
    attempts: number;
    timestamp: string;
  };
}

class FacturacionService {
  private config: FacturacionConfig;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 segundo

  constructor() {
    this.config = {
      portalUrl: import.meta.env.VITE_FACTURACION_URL || 'https://smart-invoice.com.mx/autofactura/autofactura/IndexTicket',
      apiKey: import.meta.env.VITE_FACTURACION_API_KEY || 'wQmT7+roaK6+',
      clientId: import.meta.env.VITE_FACTURACION_CLIENT_ID || 'Procura',
      webhookUrl: import.meta.env.VITE_FACTURACION_WEBHOOK_URL || ''
    };
  }

  /**
   * Abre el portal de facturación en una nueva ventana
   */
  openPortal(): void {
    window.open(this.config.portalUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Abre el portal con datos específicos de facturación
   */
  openPortalWithData(facturaData: FacturaData): void {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      paciente_id: facturaData.pacienteId,
      paciente_nombre: facturaData.pacienteNombre,
      monto: facturaData.monto.toString(),
      concepto: facturaData.concepto,
      fecha: facturaData.fecha,
      ...(facturaData.pacienteRfc && { paciente_rfc: facturaData.pacienteRfc }),
      ...(facturaData.metodoPago && { metodo_pago: facturaData.metodoPago })
    });

    const url = `${this.config.portalUrl}?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Verifica si la configuración está completa
   */
  isConfigured(): boolean {
    return !!(this.config.portalUrl && this.config.apiKey);
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): FacturacionConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<FacturacionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Genera un token de autenticación para el portal
   */
  async generateAuthToken(): Promise<string | null> {
    try {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación disponible');
        return null;
      }

      const response = await fetch('/api/facturacion/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: this.config.clientId
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error generando token de autenticación:', error);
      return null;
    }
  }

  /**
   * Sincroniza datos con el portal de facturación
   */
  async syncData(): Promise<boolean> {
    try {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación disponible');
        return false;
      }

      const response = await fetch('/api/facturacion/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      return false;
    }
  }

  /**
   * Crea un ticket en NimbusLabs con reintentos automáticos
   */
  async createTicket(ticketData: any): Promise<number> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${this.retryAttempts} - Enviando ticket al backend:`, ticketData);
        
        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación disponible');
        }

        const response = await fetch('/api/facturacion/create-ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(ticketData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const result: TicketResponse = await response.json();
        console.log(`✅ Respuesta del backend (intento ${attempt}):`, result);
        
        if (result.success) {
          return result.codigo || 1;
        } else {
          throw new Error(result.message || 'Error desconocido del backend');
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Intento ${attempt} falló:`, error);
        
        // Si es el último intento, no esperamos
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * attempt; // Delay progresivo
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Todos los intentos fallaron
    console.error(`❌ Fallaron todos los ${this.retryAttempts} intentos. Último error:`, lastError);
    return -1;
  }

  /**
   * Valida los datos del ticket antes de enviarlos
   */
  validateTicketData(ticketData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ticketData) {
      errors.push('Datos del ticket no proporcionados');
      return { isValid: false, errors };
    }

    if (!ticketData.Fecha) errors.push('Fecha es requerida');
    if (!ticketData.MontoTicket || ticketData.MontoTicket <= 0) errors.push('Monto del ticket debe ser mayor a 0');
    if (!ticketData.NumTicket) errors.push('Número de ticket es requerido');
    if (!ticketData.ClaveTienda) errors.push('Clave de tienda es requerida');
    
    if (!ticketData.Conceptos || !Array.isArray(ticketData.Conceptos) || ticketData.Conceptos.length === 0) {
      errors.push('Al menos un concepto es requerido');
    } else {
      ticketData.Conceptos.forEach((concepto: any, index: number) => {
        if (!concepto.ClaveSat) errors.push(`Concepto ${index + 1}: Clave SAT es requerida`);
        if (!concepto.Descripcion) errors.push(`Concepto ${index + 1}: Descripción es requerida`);
        if (!concepto.Monto || concepto.Monto <= 0) errors.push(`Concepto ${index + 1}: Monto debe ser mayor a 0`);
        if (!concepto.ClaveUnidad) errors.push(`Concepto ${index + 1}: Clave de unidad es requerida`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crea un ticket con validación previa
   */
  async createTicketWithValidation(ticketData: any): Promise<{ success: boolean; codigo: number; message: string }> {
    // Validar datos antes de enviar
    const validation = this.validateTicketData(ticketData);
    if (!validation.isValid) {
      return {
        success: false,
        codigo: -1,
        message: `Datos inválidos: ${validation.errors.join(', ')}`
      };
    }

    try {
      const codigo = await this.createTicket(ticketData);
      
      if (codigo === 1) {
        return {
          success: true,
          codigo,
          message: 'Ticket creado exitosamente'
        };
      } else {
        return {
          success: false,
          codigo,
          message: `Error al crear ticket. Código: ${codigo}`
        };
      }
    } catch (error) {
      return {
        success: false,
        codigo: -1,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Instancia singleton del servicio
export const facturacionService = new FacturacionService();
export default facturacionService; 