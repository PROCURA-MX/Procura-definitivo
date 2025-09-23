"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateMultiTenant = authenticateMultiTenant;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.filterByOrganization = filterByOrganization;
exports.verifyOrganizationAccess = verifyOrganizationAccess;
exports.applyTenantFilter = applyTenantFilter;
exports.validateResourceOwnership = validateResourceOwnership;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Middleware robusto de multi-tenancy para producción
 * Maneja autenticación y mapeo de organización a sedeId
 */
async function authenticateMultiTenant(req, res, next) {
    try {
        // 1. Verificar token de autenticación
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticación requerido' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        // 2. Verificar y decodificar token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // 3. Obtener información del usuario desde la base de datos
        const user = await prisma_1.default.usuario.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                organizacion_id: true,
                rol: true,
                consultorio_id: true
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        // 4. Determinar sedeId - PRIORIZAR EL DEL FRONTEND SI ESTÁ DISPONIBLE
        let sedeId;
        // Verificar si hay sedeId en el body o query params (del frontend)
        const frontendSedeId = req.body?.sedeId || req.query?.sedeId;
        if (frontendSedeId && typeof frontendSedeId === 'string') {
            // USAR EL SEDEID DEL FRONTEND
            sedeId = frontendSedeId;
            console.log('🔍 Tenant Middleware - Usando sedeId del frontend:', sedeId);
        }
        else {
            // USAR EL MAPEO DE ORGANIZACIÓN (fallback) - VERSIÓN DINÁMICA
            sedeId = await mapOrganizationToSedeId(user.organizacion_id);
            console.log('🔍 Tenant Middleware - Usando sedeId del mapeo dinámico:', sedeId);
        }
        // 5. VALIDACIÓN ADICIONAL: Detectar y corregir sedeId falso
        if (sedeId === 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21') {
            console.log('⚠️ Tenant Middleware - Detectado sedeId falso, consultando sede real...');
            const realSede = await prisma_1.default.sede.findFirst({
                where: {
                    organizacion_id: user.organizacion_id
                },
                select: {
                    id: true,
                    name: true
                }
            });
            if (realSede) {
                sedeId = realSede.id;
                console.log(`✅ Tenant Middleware - SedeId corregido: ${realSede.id} (${realSede.name})`);
            }
            else {
                console.log('⚠️ Tenant Middleware - No se encontró sede real, manteniendo fallback');
            }
        }
        // 6. Agregar información de tenant a la request
        req.tenantId = sedeId;
        req.organizationId = user.organizacion_id;
        req.tenantFilter = { organizacion_id: user.organizacion_id };
        req.user = { ...req.user, ...user, sedeId };
        // 7. Asignar propiedades directamente al objeto req para compatibilidad
        req.userId = user.id;
        req.email = user.email;
        req.sedeId = sedeId;
        req.userConsultorioId = user.consultorio_id;
        console.log('🔍 Tenant Middleware - Valores asignados:', {
            tenantId: req.tenantId,
            organizationId: req.organizationId,
            sedeId: sedeId,
            userConsultorioId: user.consultorio_id
        });
        console.log('🔍 Tenant Middleware - Mapeo aplicado:', {
            inputOrganizationId: user.organizacion_id,
            outputSedeId: sedeId,
            mapeoCorrecto: sedeId === 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21'
        });
        console.log('🔍 Tenant Middleware - Valores asignados:', {
            tenantId: req.tenantId,
            organizationId: req.organizationId,
            sedeId: sedeId,
            userConsultorioId: user.consultorio_id
        });
        console.log('🔍 Tenant Middleware:', {
            userId: user.id,
            email: user.email,
            organizationId: user.organizacion_id,
            sedeId,
            rol: user.rol
        });
        next();
    }
    catch (error) {
        console.error('❌ Error en Tenant Middleware:', error);
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
}
/**
 * Mapea la organización del usuario al sedeId correspondiente - VERSIÓN DINÁMICA
 * Consulta la base de datos para obtener el sedeId real
 */
async function mapOrganizationToSedeId(organizationId) {
    try {
        // 🚀 MAPEO DINÁMICO: Consultar la base de datos para obtener el sedeId real
        const sede = await prisma_1.default.sede.findFirst({
            where: {
                organizacion_id: organizationId
            },
            select: {
                id: true,
                name: true
            }
        });
        if (sede) {
            console.log(`✅ Mapeo dinámico encontrado: ${organizationId} -> ${sede.id} (${sede.name})`);
            return sede.id;
        }
        // Fallback: Si no se encuentra sede, usar el consultorioId del usuario
        console.warn(`⚠️ No se encontró sede para organización: ${organizationId}, usando fallback`);
        return 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21';
    }
    catch (error) {
        console.error(`❌ Error en mapeo dinámico para organización ${organizationId}:`, error);
        // Fallback en caso de error
        return 'ae72a3f3-ea9d-4f1c-aa58-cb012f714e21';
    }
}
/**
 * Middleware para verificar permisos específicos
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        // Verificar si el usuario tiene el permiso requerido
        const hasPermission = req.user[permission];
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Permiso insuficiente',
                required: permission,
                user: req.user.email
            });
        }
        next();
    };
}
/**
 * Middleware para verificar rol específico
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (req.user.rol !== role) {
            return res.status(403).json({
                error: 'Rol insuficiente',
                required: role,
                current: req.user.rol
            });
        }
        next();
    };
}
/**
 * Middleware para rutas que no requieren autenticación pero sí filtrado por organización
 * (ej: webhooks, endpoints públicos)
 */
function filterByOrganization(req, res, next) {
    const organizacionId = req.headers['x-organizacion-id'];
    if (!organizacionId) {
        return res.status(400).json({ error: 'ID de organización requerido' });
    }
    req.tenantFilter = { organizacion_id: organizacionId };
    next();
}
/**
 * Middleware para verificar que el usuario pertenece a la organización correcta
 */
function verifyOrganizationAccess(req, res, next) {
    const user = req.user;
    const organizacionId = req.params.organizacionId || req.body.organizacion_id;
    if (!user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    if (organizacionId && user.organizacion_id !== organizacionId) {
        return res.status(403).json({ error: 'Acceso denegado a esta organización' });
    }
    next();
}
/**
 * Función helper para aplicar filtros de tenant a consultas Prisma
 */
function applyTenantFilter(baseWhere = {}, tenantFilter) {
    return {
        ...baseWhere,
        ...tenantFilter
    };
}
/**
 * Función helper para validar que un recurso pertenece a la organización del usuario
 */
async function validateResourceOwnership(model, resourceId, organizacionId) {
    const resource = await model.findFirst({
        where: {
            id: resourceId,
            organizacion_id: organizacionId
        }
    });
    return !!resource;
}
