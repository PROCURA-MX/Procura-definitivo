import { Router } from 'express';
import * as cobroConceptoController from '../controllers/cobroConceptoController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(cobroConceptoController.getAllCobroConceptos));
router.get('/:id', asyncHandler(cobroConceptoController.getCobroConceptoById));
router.post('/', asyncHandler(cobroConceptoController.createCobroConcepto));
router.put('/:id', asyncHandler(cobroConceptoController.updateCobroConcepto));
router.delete('/:id', asyncHandler(cobroConceptoController.deleteCobroConcepto));

export default router; 