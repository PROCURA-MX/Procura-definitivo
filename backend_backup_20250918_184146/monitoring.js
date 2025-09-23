// Sistema de monitoreo para el servidor multi-tenant
const os = require('os')

class ServerMonitor {
  constructor() {
    this.startTime = Date.now()
    this.requestCount = 0
    this.errorCount = 0
    this.slowQueries = []
    this.activeConnections = 0
    this.maxMemoryUsage = 0
    
    // Limpiar cache cada 10 minutos
    setInterval(() => {
      this.cleanupCache()
    }, 10 * 60 * 1000)
    
    // Log de estadísticas cada 5 minutos
    setInterval(() => {
      this.logStats()
    }, 5 * 60 * 1000)
  }

  recordRequest() {
    this.requestCount++
  }

  recordError() {
    this.errorCount++
  }

  recordSlowQuery(query, duration) {
    this.slowQueries.push({
      query,
      duration,
      timestamp: Date.now()
    })
    
    // Mantener solo las últimas 100 queries lentas
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100)
    }
  }

  recordConnection() {
    this.activeConnections++
  }

  recordDisconnection() {
    this.activeConnections = Math.max(0, this.activeConnections - 1)
  }

  cleanupCache() {
    const now = Date.now()
    
    // Limpiar queries lentas antiguas (más de 1 hora)
    this.slowQueries = this.slowQueries.filter(
      query => now - query.timestamp < 60 * 60 * 1000
    )
    
    console.log('🧹 Cache limpiado')
  }

  logStats() {
    const uptime = Date.now() - this.startTime
    const memoryUsage = process.memoryUsage()
    const cpuUsage = os.loadavg()
    
    this.maxMemoryUsage = Math.max(this.maxMemoryUsage, memoryUsage.heapUsed)
    
    console.log('📊 Estadísticas del servidor:')
    console.log(`   ⏱️  Uptime: ${Math.floor(uptime / 1000 / 60)} minutos`)
    console.log(`   📈 Requests totales: ${this.requestCount}`)
    console.log(`   ❌ Errores totales: ${this.errorCount}`)
    console.log(`   🔗 Conexiones activas: ${this.activeConnections}`)
    console.log(`   💾 Memoria usada: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`)
    console.log(`   📊 Memoria máxima: ${Math.round(this.maxMemoryUsage / 1024 / 1024)} MB`)
    console.log(`   🖥️  CPU load: ${cpuUsage[0].toFixed(2)}`)
    console.log(`   🐌 Queries lentas: ${this.slowQueries.length}`)
    
    // Alertas
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️  ALERTA: Uso de memoria alto')
    }
    
    if (this.errorCount > this.requestCount * 0.1) { // 10% de errores
      console.warn('⚠️  ALERTA: Tasa de errores alta')
    }
    
    if (this.slowQueries.length > 50) {
      console.warn('⚠️  ALERTA: Muchas queries lentas')
    }
  }

  getHealthStatus() {
    const memoryUsage = process.memoryUsage()
    const uptime = Date.now() - this.startTime
    
    return {
      status: 'healthy',
      uptime: Math.floor(uptime / 1000),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        max: Math.round(this.maxMemoryUsage / 1024 / 1024)
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) : 0
      },
      connections: this.activeConnections,
      slowQueries: this.slowQueries.length
    }
  }
}

// Instancia global del monitor
const serverMonitor = new ServerMonitor()

module.exports = serverMonitor 