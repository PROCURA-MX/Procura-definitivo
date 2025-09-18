import { Router } from 'express';
import * as historialCobroController from '../controllers/historialCobroController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', ...historialCobroController.getAllHistorialCobros);
router.get('/:id', ...historialCobroController.getHistorialCobroById);
router.post('/', ...historialCobroController.createHistorialCobro);
router.put('/:id', ...historialCobroController.updateHistorialCobro);
router.delete('/:id', ...historialCobroController.deleteHistorialCobro);

export default router; 