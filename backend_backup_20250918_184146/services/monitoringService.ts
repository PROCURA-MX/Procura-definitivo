// Servicio de monitoring para producción
interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
}

interface ErrorMetric {
  error: string;
  stack?: string;
  endpoint?: string;
  userId?: string;
  timestamp: Date;
}

class MonitoringService {
  private performanceMetrics: PerformanceMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private readonly MAX_METRICS = 1000; // Mantener solo los últimos 1000 registros

  // Registrar métrica de performance
  recordPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.push(metric);
    
    // Mantener solo los últimos registros
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS);
    }
  }

  // Registrar error
  recordError(error: ErrorMetric): void {
    this.errorMetrics.push(error);
    
    // Mantener solo los últimos registros
    if (this.errorMetrics.length > this.MAX_METRICS) {
      this.errorMetrics = this.errorMetrics.slice(-this.MAX_METRICS);
    }
  }

  // Obtener estadísticas de performance
  getPerformanceStats(): any {
    if (this.performanceMetrics.length === 0) {
      return { message: 'No hay métricas de performance disponibles' };
    }

    const avgDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length;
    const slowRequests = this.performanceMetrics.filter(m => m.duration > 1000);
    const errorRequests = this.performanceMetrics.filter(m => m.statusCode >= 400);

    return {
      totalRequests: this.performanceMetrics.length,
      averageResponseTime: Math.round(avgDuration),
      slowRequests: slowRequests.length,
      errorRate: (errorRequests.length / this.performanceMetrics.length * 100).toFixed(2) + '%',
      recentMetrics: this.performanceMetrics.slice(-10)
    };
  }

  // Obtener estadísticas de errores
  getErrorStats(): any {
    if (this.errorMetrics.length === 0) {
      return { message: 'No hay errores registrados' };
    }

    const errorCounts = new Map<string, number>();
    this.errorMetrics.forEach(error => {
      const key = error.error;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    return {
      totalErrors: this.errorMetrics.length,
      errorTypes: Object.fromEntries(errorCounts),
      recentErrors: this.errorMetrics.slice(-10)
    };
  }

  // Middleware para Express
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const originalSend = res.send;
      const self = this;

      res.send = function(data: any) {
        const duration = Date.now() - start;
        
        self.recordPerformance({
          endpoint: req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
          timestamp: new Date(),
          userId: req.user?.id
        });

        originalSend.call(this, data);
      };

      next();
    };
  }

  // Limpiar métricas antiguas
  cleanup(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.performanceMetrics = this.performanceMetrics.filter(
      m => m.timestamp > oneHourAgo
    );
    
    this.errorMetrics = this.errorMetrics.filter(
      e => e.timestamp > oneHourAgo
    );
  }

  // Obtener health check
  getHealthCheck(): any {
    return {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      performance: this.getPerformanceStats(),
      errors: this.getErrorStats()
    };
  }
}

// Instancia global del servicio de monitoring
export const monitoringService = new MonitoringService();

// Limpiar métricas cada hora
setInterval(() => {
  monitoringService.cleanup();
}, 60 * 60 * 1000);

export default monitoringService; 