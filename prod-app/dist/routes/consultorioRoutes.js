"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const consultorioController = __importStar(require("../controllers/consultorioController"));
const tenantMiddleware_1 = require("../middleware/tenantMiddleware");
const router = (0, express_1.Router)();
// Aplicar middleware de autenticación multi-tenant a todas las rutas
router.use(tenantMiddleware_1.authenticateMultiTenant);
// Rutas específicas ANTES que las generales para evitar conflictos
router.get('/health', consultorioController.healthCheck);
router.get('/usuario', consultorioController.getConsultoriosUsuario);
router.get('/:consultorioId/doctor', consultorioController.getDoctorDelConsultorio);
router.get('/', consultorioController.getAllConsultorios);
router.get('/:id', consultorioController.getConsultorioById);
router.post('/', consultorioController.createConsultorio);
router.put('/:id', consultorioController.updateConsultorio);
router.delete('/:id', consultorioController.deleteConsultorio);
exports.default = router;
