import { Router } from 'express'
import { getBloqueosMedico, createBloqueoMedico, updateBloqueoMedico, deleteBloqueoMedico } from '../controllers/bloqueoMedicoController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// ✅ ARREGLADO: Agregar middleware de autenticación a todas las rutas
router.get('/', authenticateToken, getBloqueosMedico)
router.post('/', authenticateToken, createBloqueoMedico)
router.put('/:id', authenticateToken, updateBloqueoMedico)
router.delete('/:id', authenticateToken, deleteBloqueoMedico)

export default router 