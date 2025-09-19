import { Router } from 'express';
import { EventService } from '../services/eventService';

const router = Router();
const eventService = EventService.getInstance();

router.get('/status', async (req, res) => {
  try {
    const status = eventService.getQueueStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error obteniendo estado de eventos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA PARA DEBUGGING
router.post('/test', async (req, res) => {
  try {
    const eventId = await eventService.addEvent('TEST_EVENT', {
      message: 'Evento de prueba',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: { eventId, message: 'Evento de prueba agregado' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error agregando evento de prueba:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
