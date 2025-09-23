import { Router } from 'express'
import { getDisponibilidadesMedico, createDisponibilidadMedico, updateDisponibilidadMedico, deleteDisponibilidadMedico } from '../controllers/disponibilidadMedicoController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// ✅ ARREGLADO: Agregar middleware de autenticación a todas las rutas
router.get('/', authenticateToken, getDisponibilidadesMedico)
router.post('/', authenticateToken, createDisponibilidadMedico)
router.put('/:id', authenticateToken, updateDisponibilidadMedico)
router.delete('/:id', authenticateToken, deleteDisponibilidadMedico)

export default router 

export default router 