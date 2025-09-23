import { Router } from 'express';
import * as pacienteController from '../controllers/pacienteController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', pacienteController.getAllPacientes);
router.get('/search', pacienteController.searchPacientes);
router.get('/:id', pacienteController.getPacienteById);
router.post('/', pacienteController.createPaciente);
router.put('/:id', pacienteController.updatePaciente);
router.delete('/:id', pacienteController.deletePaciente);

export default router; 