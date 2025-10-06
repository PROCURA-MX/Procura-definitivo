import { Router } from 'express';
import { getMetrics, resetMetrics } from '../controllers/metricsController';

const router = Router();

// GET /api/metrics - Obtener métricas de performance
router.get('/', getMetrics);

// POST /api/metrics/reset - Resetear contadores (solo desarrollo)
router.post('/reset', resetMetrics);

export default router;
