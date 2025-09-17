import { Router } from 'express';
import * as historialCobroController from '../controllers/historialCobroController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(historialCobroController.getAllHistorialCobros));
router.get('/:id', asyncHandler(historialCobroController.getHistorialCobroById));
router.post('/', asyncHandler(historialCobroController.createHistorialCobro));
router.put('/:id', asyncHandler(historialCobroController.updateHistorialCobro));
router.delete('/:id', asyncHandler(historialCobroController.deleteHistorialCobro));

export default router; 