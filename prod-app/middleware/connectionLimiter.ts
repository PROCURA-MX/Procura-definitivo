// Middleware para limitar conexiones simultáneas y prevenir saturación
import { Request, Response, NextFunction } from 'express';

interface ConnectionInfo {
  startTime: number;
  ip: string;
  userAgent: string;
  endpoint: string;
}

class ConnectionLimiter {
  private activeConnections = new Map<string, ConnectionInfo>();
  private maxConnections = 100; // Máximo 100 conexiones simultáneas
  private maxConnectionsPerIP = 10; // Máximo 10 conexiones por IP
  private connectionTimeout = 30000; // 30 segundos timeout por conexión

  // Registrar nueva conexión
  registerConnection(req: Request): boolean {
    const clientId = this.getClientId(req);
    const ip = this.getClientIP(req);
    
    // Verificar límite global
    if (this.activeConnections.size >= this.maxConnections) {
      console.warn(`🚨 Límite global de conexiones alcanzado: ${this.activeConnections.size}/${this.maxConnections}`);
      return false;
    }

    // Verificar límite por IP
    const ipConnections = Array.from(this.activeConnections.values())
      .filter(conn => conn.ip === ip).length;
    
    if (ipConnections >= this.maxConnectionsPerIP) {
      console.warn(`🚨 Límite de conexiones por IP alcanzado: ${ip} (${ipConnections}/${this.maxConnectionsPerIP})`);
      return false;
    }

    // Registrar conexión
    this.activeConnections.set(clientId, {
      startTime: Date.now(),
      ip,
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: req.originalUrl
    });

    console.log(`📊 Nueva conexión: ${clientId} (${this.activeConnections.size}/${this.maxConnections})`);
    return true;
  }

  // Remover conexión
  removeConnection(req: Request): void {
    const clientId = this.getClientId(req);
    this.activeConnections.delete(clientId);
  }

  // Obtener ID único del cliente
  private getClientId(req: Request): string {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}-${userAgent.slice(0, 20)}-${Date.now()}`;
  }

  // Obtener IP del cliente
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any)?.socket?.remoteAddress || 
           'unknown';
  }

  // Limpiar conexiones expiradas
  cleanupExpiredConnections(): void {
    const now = Date.now();
    for (const [clientId, connection] of this.activeConnections.entries()) {
      if (now - connection.startTime > this.connectionTimeout) {
        console.warn(`⏰ Conexión expirada removida: ${clientId}`);
        this.activeConnections.delete(clientId);
      }
    }
  }

  // Obtener estadísticas
  getStats() {
    const ipStats = new Map<string, number>();
    for (const connection of this.activeConnections.values()) {
      ipStats.set(connection.ip, (ipStats.get(connection.ip) || 0) + 1);
    }

    return {
      totalConnections: this.activeConnections.size,
      maxConnections: this.maxConnections,
      maxConnectionsPerIP: this.maxConnectionsPerIP,
      connectionsByIP: Object.fromEntries(ipStats),
      topIPs: Array.from(ipStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }

  // Middleware principal
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Limpiar conexiones expiradas cada 100 requests
      if (Math.random() < 0.01) {
        this.cleanupExpiredConnections();
      }

      // Intentar registrar conexión
      if (!this.registerConnection(req)) {
        return res.status(503).json({
          error: 'Servidor temporalmente saturado',
          message: 'Demasiadas conexiones activas. Intenta de nuevo en unos momentos.',
          retryAfter: 30
        });
      }

      // Remover conexión cuando termine la request
      res.on('finish', () => {
        this.removeConnection(req);
      });

      res.on('close', () => {
        this.removeConnection(req);
      });

      next();
    };
  }
}

// Instancia global
export const connectionLimiter = new ConnectionLimiter();

// Limpiar conexiones expiradas cada 30 segundos
setInterval(() => {
  connectionLimiter.cleanupExpiredConnections();
}, 30000);

// Middleware exportado
export const connectionLimiterMiddleware = connectionLimiter.middleware();
