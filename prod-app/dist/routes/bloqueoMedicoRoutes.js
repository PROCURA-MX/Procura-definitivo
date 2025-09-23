"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bloqueoMedicoController_1 = require("../controllers/bloqueoMedicoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ ARREGLADO: Agregar middleware de autenticación a todas las rutas
router.get('/', auth_1.authenticateToken, bloqueoMedicoController_1.getBloqueosMedico);
router.post('/', auth_1.authenticateToken, bloqueoMedicoController_1.createBloqueoMedico);
router.put('/:id', auth_1.authenticateToken, bloqueoMedicoController_1.updateBloqueoMedico);
router.delete('/:id', auth_1.authenticateToken, bloqueoMedicoController_1.deleteBloqueoMedico);
exports.default = router;
