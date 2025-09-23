"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const disponibilidadMedicoController_1 = require("../controllers/disponibilidadMedicoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ ARREGLADO: Agregar middleware de autenticación a todas las rutas
router.get('/', auth_1.authenticateToken, disponibilidadMedicoController_1.getDisponibilidadesMedico);
router.post('/', auth_1.authenticateToken, disponibilidadMedicoController_1.createDisponibilidadMedico);
router.put('/:id', auth_1.authenticateToken, disponibilidadMedicoController_1.updateDisponibilidadMedico);
router.delete('/:id', auth_1.authenticateToken, disponibilidadMedicoController_1.deleteDisponibilidadMedico);
exports.default = router;
