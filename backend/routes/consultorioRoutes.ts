import { Router } from 'express';
import * as consultorioController from '../controllers/consultorioController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Aplicar middleware de autenticación multi-tenant a todas las rutas
router.use(authenticateMultiTenant);

// Rutas específicas ANTES que las generales para evitar conflictos
router.get('/health', consultorioController.healthCheck);
router.get('/usuario', consultorioController.getConsultoriosUsuario);
router.get('/:consultorioId/doctor', consultorioController.getDoctorDelConsultorio);
router.get('/', consultorioController.getAllConsultorios);
router.get('/:id', consultorioController.getConsultorioById);
router.post('/', consultorioController.createConsultorio);
router.put('/:id', consultorioController.updateConsultorio);
router.delete('/:id', consultorioController.deleteConsultorio);

export default router; 