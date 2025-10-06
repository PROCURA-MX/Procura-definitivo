// Monitor de performance para optimización del servidor
interface PerformanceMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  activeConnections: number;
  slowQueries: number;
  errorCount: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private slowQueries = 0;
  private errorCount = 0;
  private maxMetrics = 100; // Mantener solo las últimas 100 métricas

  // Incrementar contador de queries lentas
  incrementSlowQueries() {
    this.slowQueries++;
  }

  // Incrementar contador de errores
  incrementErrors() {
    this.errorCount++;
  }

  // Capturar métricas actuales
  captureMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      activeConnections: 0, // Se puede implementar tracking de conexiones activas
      slowQueries: this.slowQueries,
      errorCount: this.errorCount,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    // Mantener solo las últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return metrics;
  }

  // Obtener métricas recientes
  getRecentMetrics(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  // Obtener estadísticas de memoria
  getMemoryStats() {
    const recent = this.getRecentMetrics(5);
    if (recent.length === 0) return null;

    const memoryUsages = recent.map(m => m.memoryUsage.heapUsed);
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const maxMemory = Math.max(...memoryUsages);
    const minMemory = Math.min(...memoryUsages);

    return {
      average: Math.round(avgMemory / 1024 / 1024), // MB
      max: Math.round(maxMemory / 1024 / 1024), // MB
      min: Math.round(minMemory / 1024 / 1024), // MB
      current: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) // MB
    };
  }

  // Log de métricas cada 5 minutos en producción
  startMonitoring() {
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const stats = this.getMemoryStats();
        if (stats) {
          console.log(`📊 Performance: Memoria ${stats.current}MB (avg: ${stats.average}MB, max: ${stats.max}MB), Queries lentas: ${this.slowQueries}, Errores: ${this.errorCount}`);
          
          // ALERTAS AUTOMÁTICAS
          this.checkAlerts(stats);
        }
      }, 5 * 60 * 1000); // 5 minutos
    }
  }

  // Sistema de alertas automáticas
  private checkAlerts(stats: any) {
    const alerts: string[] = [];

    // Alerta de memoria alta
    if (stats.current > 500) {
      alerts.push(`🚨 ALERTA: Memoria alta (${stats.current}MB > 500MB)`);
    }

    // Alerta de queries lentas
    if (this.slowQueries > 10) {
      alerts.push(`🚨 ALERTA: Queries lentas (${this.slowQueries} > 10)`);
    }

    // Alerta de errores
    if (this.errorCount > 5) {
      alerts.push(`🚨 ALERTA: Errores altos (${this.errorCount} > 5)`);
    }

    // Alerta de memoria creciente
    if (stats.max > stats.average * 1.5) {
      alerts.push(`🚨 ALERTA: Memoria creciente (max: ${stats.max}MB vs avg: ${stats.average}MB)`);
    }

    // Enviar alertas
    if (alerts.length > 0) {
      console.error('🚨 ALERTAS DE SATURACIÓN:');
      alerts.forEach(alert => console.error(alert));
      
      // Aquí podrías integrar con servicios de alertas como:
      // - Slack webhook
      // - Email
      // - SMS
      // - Discord
    }
  }

  // Resetear contadores
  resetCounters() {
    this.slowQueries = 0;
    this.errorCount = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Iniciar monitoreo automático
performanceMonitor.startMonitoring();
