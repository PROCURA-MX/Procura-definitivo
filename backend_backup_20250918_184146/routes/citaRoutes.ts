import { Router } from 'express';
import * as citaController from '../controllers/citaController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Rutas protegidas (requieren autenticación y multi-tenancy)
router.get('/', authenticateMultiTenant, citaController.getAllCitas);
router.post('/', authenticateMultiTenant, citaController.createCita);
router.delete('/:id', authenticateMultiTenant, citaController.deleteCita);
router.put('/:id', authenticateMultiTenant, citaController.updateCita);

export default router; 