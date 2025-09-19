import { Router } from 'express';
import * as cobroController from '../controllers/cobroController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Rutas protegidas (requieren autenticación y multi-tenancy)
router.get('/', authenticateMultiTenant, cobroController.getAllCobros);
router.get('/:id', authenticateMultiTenant, cobroController.getCobroById);
router.post('/', authenticateMultiTenant, cobroController.createCobro);
router.put('/:id', authenticateMultiTenant, cobroController.updateCobro);
router.delete('/:id', authenticateMultiTenant, cobroController.deleteCobro);

// Rutas para agregar servicios y conceptos al cobro
router.post('/:id/servicio', authenticateMultiTenant, cobroController.addServicioToCobro);
router.post('/:id/concepto', authenticateMultiTenant, cobroController.addConceptoToCobro);

export default router; 