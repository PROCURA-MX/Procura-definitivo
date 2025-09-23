"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmunotherapyController = void 0;
const immunotherapyService_1 = require("../services/immunotherapyService");
// 🏥 CONTROLADOR DE EXPEDIENTES DE INMUNOTERAPIA
class ImmunotherapyController {
    // 🎯 OBTENER EXPEDIENTE COMPLETO DE UN PACIENTE
    async getPatientRecord(req, res) {
        try {
            const { pacienteId } = req.params;
            // 🎯 OBTENER organizacionId DEL USUARIO AUTENTICADO (como en getLastTreatmentForPatient)
            const organizacionId = req.user?.organizacion_id;
            if (!pacienteId || !organizacionId) {
                return res.status(400).json({
                    success: false,
                    error: 'pacienteId y organizacionId son requeridos'
                });
            }
            const record = await immunotherapyService_1.ImmunotherapyService.getInstance().getRecordWithLog(pacienteId, organizacionId);
            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'Expediente no encontrado'
                });
            }
            return res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('❌ Error en getPatientRecord:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 OBTENER SOLO EL LOG DE INMUNOTERAPIA DE UN PACIENTE
    async getPatientLog(req, res) {
        try {
            const { pacienteId } = req.params;
            const { organizacionId } = req.body;
            if (!pacienteId || !organizacionId) {
                return res.status(400).json({
                    success: false,
                    error: 'pacienteId y organizacionId son requeridos'
                });
            }
            const log = await immunotherapyService_1.ImmunotherapyService.getInstance().getImmunotherapyLog(pacienteId, organizacionId);
            return res.json({
                success: true,
                data: log
            });
        }
        catch (error) {
            console.error('❌ Error en getPatientLog:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 CREAR O ACTUALIZAR EXPEDIENTE
    async createOrUpdateRecord(req, res) {
        try {
            const dto = req.body;
            if (!dto.pacienteId || !dto.organizacionId || !dto.fechaInicio || !dto.editadoPor) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son requeridos'
                });
            }
            const record = await immunotherapyService_1.ImmunotherapyService.getInstance().createOrUpdateRecord(dto);
            return res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('❌ Error en createOrUpdateRecord:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 SOLO LEER EXPEDIENTE - NO CREAR NI ACTUALIZAR (Sistema de Estado Único)
    async createOrUpdateRecordWithId(req, res) {
        try {
            const { pacienteId } = req.params;
            console.log(`🎯 [ImmunotherapyController] Petición POST recibida para LECTURA:`, {
                pacienteId,
                bodyKeys: Object.keys(req.body || {}),
                bodySize: JSON.stringify(req.body || {}).length,
                user: req.user ? 'SÍ' : 'NO',
                organizacionId: req.user?.organizacion_id || 'NO'
            });
            // 🎯 SOLUCIÓN ROBUSTA: Obtener organizacionId del usuario autenticado del middleware
            const organizacionId = req.user?.organizacion_id;
            if (!organizacionId) {
                console.log('❌ [ImmunotherapyController] No se pudo determinar la organización del usuario');
                return res.status(400).json({
                    success: false,
                    error: 'No se pudo determinar la organización del usuario'
                });
            }
            console.log('🔍 [ImmunotherapyController] Buscando expediente para paciente:', pacienteId, 'organización:', organizacionId);
            const record = await immunotherapyService_1.ImmunotherapyService.getInstance().getRecordWithLog(pacienteId, organizacionId);
            if (!record) {
                console.log('❌ [ImmunotherapyController] Expediente no encontrado para paciente:', pacienteId);
                return res.status(404).json({
                    success: false,
                    error: 'Expediente no encontrado. Los expedientes solo se crean automáticamente al procesar tratamientos de inmunoterapia.'
                });
            }
            console.log('✅ [ImmunotherapyController] Expediente encontrado:', record.id);
            return res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('❌ Error en createOrUpdateRecordWithId:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 ACTUALIZAR FECHA DE INICIO
    async updateStartDate(req, res) {
        try {
            const { recordId } = req.params;
            const { nuevaFecha, editadoPor } = req.body;
            if (!recordId || !nuevaFecha || !editadoPor) {
                return res.status(400).json({
                    success: false,
                    error: 'recordId, nuevaFecha y editadoPor son requeridos'
                });
            }
            // 🎯 SOLUCIÓN ROBUSTA: Crear fecha local sin conversión UTC
            // nuevaFecha viene en formato "YYYY-MM-DD" desde el frontend
            const [year, month, day] = nuevaFecha.split('-').map(Number);
            const fechaLocal = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
            console.log('🔍 [updateStartDate] Fecha recibida:', nuevaFecha);
            console.log('🔍 [updateStartDate] Fecha local creada:', fechaLocal);
            const record = await immunotherapyService_1.ImmunotherapyService.getInstance().updateStartDate(recordId, fechaLocal, editadoPor);
            return res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('❌ Error en updateStartDate:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 ACTUALIZAR REACCIÓN
    async updateReaction(req, res) {
        try {
            const { usageId } = req.params;
            const { tuvoReaccion, descripcion, medicamento } = req.body;
            if (usageId === undefined || tuvoReaccion === undefined) {
                return res.status(400).json({
                    success: false,
                    error: 'usageId y tuvoReaccion son requeridos'
                });
            }
            const record = await immunotherapyService_1.ImmunotherapyService.getInstance().updateReaction(usageId, tuvoReaccion, descripcion);
            return res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('❌ Error en updateReaction:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 VERIFICAR SI UN PACIENTE TIENE EXPEDIENTE
    async hasRecord(req, res) {
        try {
            const { pacienteId, organizacionId } = req.query;
            if (!pacienteId || !organizacionId) {
                return res.status(400).json({
                    success: false,
                    error: 'pacienteId y organizacionId son requeridos'
                });
            }
            const hasRecord = await immunotherapyService_1.ImmunotherapyService.getInstance().hasRecord(pacienteId, organizacionId);
            return res.json({
                success: true,
                data: { hasRecord }
            });
        }
        catch (error) {
            console.error('❌ Error en hasRecord:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 OBTENER TODOS LOS EXPEDIENTES DE UNA ORGANIZACIÓN
    async getAllRecords(req, res) {
        try {
            const { organizacionId } = req.query;
            if (!organizacionId) {
                return res.status(400).json({
                    success: false,
                    error: 'organizacionId es requerido'
                });
            }
            const records = await immunotherapyService_1.ImmunotherapyService.getInstance().getAllRecords(organizacionId);
            return res.json({
                success: true,
                data: records
            });
        }
        catch (error) {
            console.error('❌ Error en getAllRecords:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
    // 🎯 OBTENER ÚLTIMO TRATAMIENTO PARA PRE-RELLENAR FORMULARIO
    async getLastTreatmentForPatient(req, res) {
        try {
            const { pacienteId } = req.params;
            const organizacionId = req.user?.organizacion_id;
            if (!pacienteId || !organizacionId) {
                return res.status(400).json({
                    success: false,
                    error: 'pacienteId y organizacionId son requeridos'
                });
            }
            console.log(`🔍 [ImmunotherapyController] Obteniendo último tratamiento para paciente: ${pacienteId}`);
            const lastTreatment = await immunotherapyService_1.ImmunotherapyService.getInstance().getLastTreatmentForPatient(pacienteId, organizacionId);
            if (!lastTreatment) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró ningún tratamiento previo para este paciente'
                });
            }
            return res.json({
                success: true,
                data: lastTreatment
            });
        }
        catch (error) {
            console.error('❌ Error en getLastTreatmentForPatient:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
}
exports.ImmunotherapyController = ImmunotherapyController;
