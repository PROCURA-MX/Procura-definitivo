import { Router } from 'express';
import * as precioConsultorioController from '../controllers/precioConsultorioController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(precioConsultorioController.getAllPreciosConsultorio));
router.get('/:id', asyncHandler(precioConsultorioController.getPrecioConsultorioById));
router.post('/', asyncHandler(precioConsultorioController.createPrecioConsultorio));
router.put('/:id', asyncHandler(precioConsultorioController.updatePrecioConsultorio));
router.delete('/:id', asyncHandler(precioConsultorioController.deletePrecioConsultorio));

export default router; 