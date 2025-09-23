"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const immunotherapyController_1 = require("../controllers/immunotherapyController");
const router = (0, express_1.Router)();
const immunotherapyController = new immunotherapyController_1.ImmunotherapyController();
// 🏥 RUTAS DE EXPEDIENTES DE INMUNOTERAPIA
// 🎯 OBTENER EXPEDIENTE COMPLETO DE UN PACIENTE
router.get('/record/:pacienteId', immunotherapyController.getPatientRecord.bind(immunotherapyController));
// 🎯 OBTENER SOLO EL LOG DE INMUNOTERAPIA DE UN PACIENTE
router.get('/log/:pacienteId', immunotherapyController.getPatientLog.bind(immunotherapyController));
// 🎯 CREAR O ACTUALIZAR EXPEDIENTE
router.post('/record', immunotherapyController.createOrUpdateRecord.bind(immunotherapyController));
// 🎯 CREAR O ACTUALIZAR EXPEDIENTE CON ID ESPECÍFICO (para compatibilidad con frontend)
router.post('/record/:pacienteId', immunotherapyController.createOrUpdateRecordWithId.bind(immunotherapyController));
// 🎯 ACTUALIZAR FECHA DE INICIO
router.put('/record/:recordId/start-date', immunotherapyController.updateStartDate.bind(immunotherapyController));
// 🎯 ACTUALIZAR REACCIÓN
router.put('/reaction/:usageId', immunotherapyController.updateReaction.bind(immunotherapyController));
// 🎯 VERIFICAR SI UN PACIENTE TIENE EXPEDIENTE
router.get('/has-record', immunotherapyController.hasRecord.bind(immunotherapyController));
// 🎯 OBTENER TODOS LOS EXPEDIENTES DE UNA ORGANIZACIÓN
router.get('/all-records', immunotherapyController.getAllRecords.bind(immunotherapyController));
// 🎯 OBTENER ÚLTIMO TRATAMIENTO PARA PRE-RELLENAR FORMULARIO
router.get('/last-treatment/:pacienteId', immunotherapyController.getLastTreatmentForPatient.bind(immunotherapyController));
exports.default = router;
