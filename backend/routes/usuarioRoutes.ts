import { Router } from 'express';
import * as usuarioController from '../controllers/usuarioController';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Aplicar middleware de autenticación multi-tenant a todas las rutas
router.use(authenticateMultiTenant);

router.get('/', usuarioController.getAllUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);

export default router; 