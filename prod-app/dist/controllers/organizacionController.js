"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizacionStats = exports.deleteOrganizacion = exports.updateOrganizacion = exports.createOrganizacion = exports.getOrganizacionById = exports.getAllOrganizaciones = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getAllOrganizaciones = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const organizaciones = await prisma_1.default.organizacion.findMany({
        include: {
            _count: {
                select: {
                    usuarios: true,
                    consultorios: true,
                    pacientes: true,
                    servicios: true
                }
            }
        }
    });
    res.json(organizaciones);
});
exports.getOrganizacionById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const organizacion = await prisma_1.default.organizacion.findUnique({
        where: { id },
        include: {
            usuarios: {
                include: { consultorio: true }
            },
            consultorios: true,
            servicios: true,
            pacientes: {
                take: 10,
                orderBy: { created_at: 'desc' }
            },
            _count: {
                select: {
                    usuarios: true,
                    consultorios: true,
                    pacientes: true,
                    servicios: true
                }
            }
        }
    });
    if (!organizacion) {
        return res.status(404).json({ error: 'Organización no encontrada' });
    }
    res.json(organizacion);
});
exports.createOrganizacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre de organización es requerido' });
    }
    const organizacion = await prisma_1.default.organizacion.create({
        data: {
            nombre,
            ruc,
            direccion,
            telefono,
            email,
            logo_url,
            color_primario: color_primario || '#3B82F6',
            color_secundario: color_secundario || '#1F2937'
        }
    });
    res.json(organizacion);
});
exports.updateOrganizacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { nombre, ruc, direccion, telefono, email, logo_url, color_primario, color_secundario } = req.body;
    const updateData = {};
    if (nombre)
        updateData.nombre = nombre;
    if (ruc !== undefined)
        updateData.ruc = ruc;
    if (direccion !== undefined)
        updateData.direccion = direccion;
    if (telefono !== undefined)
        updateData.telefono = telefono;
    if (email !== undefined)
        updateData.email = email;
    if (logo_url !== undefined)
        updateData.logo_url = logo_url;
    if (color_primario)
        updateData.color_primario = color_primario;
    if (color_secundario)
        updateData.color_secundario = color_secundario;
    const organizacion = await prisma_1.default.organizacion.update({
        where: { id },
        data: updateData
    });
    res.json(organizacion);
});
exports.deleteOrganizacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verificar que no tenga datos asociados
    const counts = await prisma_1.default.$transaction([
        prisma_1.default.usuario.count({ where: { organizacion_id: id } }),
        prisma_1.default.consultorio.count({ where: { organizacion_id: id } }),
        prisma_1.default.paciente.count({ where: { organizacion_id: id } }),
        prisma_1.default.servicio.count({ where: { organizacion_id: id } })
    ]);
    const [usuarios, consultorios, pacientes, servicios] = counts;
    if (usuarios > 0 || consultorios > 0 || pacientes > 0 || servicios > 0) {
        return res.status(400).json({
            error: 'No se puede eliminar la organización porque tiene datos asociados',
            details: {
                usuarios,
                consultorios,
                pacientes,
                servicios
            }
        });
    }
    await prisma_1.default.organizacion.delete({ where: { id } });
    res.json({ message: 'Organización eliminada' });
});
exports.getOrganizacionStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const stats = await prisma_1.default.$transaction([
        prisma_1.default.usuario.count({ where: { organizacion_id: id } }),
        prisma_1.default.consultorio.count({ where: { organizacion_id: id } }),
        prisma_1.default.paciente.count({ where: { organizacion_id: id } }),
        prisma_1.default.servicio.count({ where: { organizacion_id: id } }),
        prisma_1.default.cobro.count({
            where: {
                usuario: { organizacion_id: id }
            }
        }),
        prisma_1.default.citas.count({
            where: {
                usuarios: { organizacion_id: id }
            }
        })
    ]);
    const [usuarios, consultorios, pacientes, servicios, cobros, citas] = stats;
    res.json({
        usuarios,
        consultorios,
        pacientes,
        servicios,
        cobros,
        citas
    });
});
