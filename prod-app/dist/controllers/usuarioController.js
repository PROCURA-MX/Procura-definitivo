"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUsuario = exports.updateUsuario = exports.createUsuario = exports.getUsuarioById = exports.getAllUsuarios = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getAllUsuarios = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Obtener el usuario autenticado del middleware
    const authenticatedUser = req.user;
    const organizacionId = req.organizationId;
    if (!authenticatedUser) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    // Verificar si se solicita específicamente doctores (para disponibilidad/bloqueos)
    const soloDoctores = req.query.rol === 'DOCTOR';
    let usuarios;
    if (soloDoctores && organizacionId) {
        // Para disponibilidad/bloqueos: mostrar todos los doctores de la organización
        usuarios = await prisma_1.default.$queryRaw `
             SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.rol, u.consultorio_id, u.created_at, u.updated_at, c.nombre as consultorio_nombre
             FROM usuarios u
             LEFT JOIN consultorios c ON u.consultorio_id = c.id
             WHERE u.rol = 'DOCTOR' AND u.organizacion_id = ${organizacionId}::uuid
             ORDER BY u.nombre, u.apellido
             LIMIT 50
           `;
    }
    else {
        // Comportamiento original: usuarios del mismo consultorio
        if (!authenticatedUser.consultorio_id) {
            console.log('🔍 getAllUsuarios - Sin consultorio, mostrando todos los usuarios de la organización');
            // Si el usuario no tiene consultorio asignado, mostrar todos los usuarios de la organización
            usuarios = await prisma_1.default.$queryRaw `
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.rol, u.consultorio_id, u.created_at, u.updated_at, c.nombre as consultorio_nombre
      FROM usuarios u
      LEFT JOIN consultorios c ON u.consultorio_id = c.id
      WHERE u.organizacion_id = ${organizacionId}::uuid
      ORDER BY u.nombre, u.apellido
      LIMIT 50
    `;
        }
        else {
            console.log('🔍 getAllUsuarios - Con consultorio, mostrando usuarios del mismo consultorio:', authenticatedUser.consultorio_id);
            // Usuario tiene consultorio asignado, mostrar usuarios del mismo consultorio
            usuarios = await prisma_1.default.$queryRaw `
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.rol, u.consultorio_id, u.created_at, u.updated_at, c.nombre as consultorio_nombre
      FROM usuarios u
      LEFT JOIN consultorios c ON u.consultorio_id = c.id
      WHERE u.consultorio_id = ${authenticatedUser.consultorio_id}
      ORDER BY u.nombre, u.apellido
      LIMIT 50
    `;
        }
    }
    res.json(usuarios);
});
exports.getUsuarioById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const usuario = await prisma_1.default.usuario.findUnique({
        where: { id },
        include: { consultorio: true }
    });
    if (!usuario)
        return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
});
exports.createUsuario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { nombre, apellido, rol, email, telefono, consultorio_id } = req.body;
    if (!nombre || !apellido || !rol || !email || !telefono) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const rolesValidos = ['DOCTOR', 'SECRETARIA', 'ADMINISTRADOR', 'ENFERMERA'];
    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
    }
    // Para roles que no son DOCTOR, el consultorio es requerido
    if (rol !== 'DOCTOR' && !consultorio_id) {
        return res.status(400).json({ error: 'Consultorio es requerido para este rol' });
    }
    // Validar que el consultorio exista (solo si se proporciona)
    if (consultorio_id) {
        const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
        if (!consultorio) {
            return res.status(400).json({ error: 'Consultorio no encontrado' });
        }
    }
    // Obtener organizacion_id del usuario autenticado o usar la organización por defecto
    const organizacionId = req.tenantFilter?.organizacion_id;
    let usuario;
    if (organizacionId) {
        // Usar SQL directo para evitar problemas de tipos
        if (consultorio_id) {
            const result = await prisma_1.default.$queryRaw `
        INSERT INTO usuarios (nombre, apellido, rol, email, telefono, consultorio_id, organizacion_id)
        VALUES (${nombre}, ${apellido}, ${rol}, ${email}, ${telefono}, ${consultorio_id}, ${organizacionId}::uuid)
        RETURNING *
      `;
            usuario = result[0];
        }
        else {
            // Para doctores sin consultorio específico
            const result = await prisma_1.default.$queryRaw `
        INSERT INTO usuarios (nombre, apellido, rol, email, telefono, organizacion_id)
        VALUES (${nombre}, ${apellido}, ${rol}, ${email}, ${telefono}, ${organizacionId}::uuid)
        RETURNING *
      `;
            usuario = result[0];
        }
        // Obtener información del consultorio si existe
        if (consultorio_id) {
            const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
            usuario.consultorio = consultorio;
        }
    }
    else {
        // Comportamiento original sin organización - usar SQL directo
        if (consultorio_id) {
            const result = await prisma_1.default.$queryRaw `
        INSERT INTO usuarios (nombre, apellido, rol, email, telefono, consultorio_id)
        VALUES (${nombre}, ${apellido}, ${rol}, ${email}, ${telefono}, ${consultorio_id})
        RETURNING *
      `;
            usuario = result[0];
        }
        else {
            // Para doctores sin consultorio específico
            const result = await prisma_1.default.$queryRaw `
        INSERT INTO usuarios (nombre, apellido, rol, email, telefono)
        VALUES (${nombre}, ${apellido}, ${rol}, ${email}, ${telefono})
        RETURNING *
      `;
            usuario = result[0];
        }
        // Obtener información del consultorio si existe
        if (consultorio_id) {
            const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
            usuario.consultorio = consultorio;
        }
    }
    res.json(usuario);
});
exports.updateUsuario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, rol, email, telefono, consultorio_id } = req.body;
    const updateData = {};
    if (nombre)
        updateData.nombre = nombre;
    if (apellido)
        updateData.apellido = apellido;
    if (rol) {
        const rolesValidos = ['DOCTOR', 'SECRETARIA', 'ADMINISTRADOR'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }
        updateData.rol = rol;
    }
    if (email)
        updateData.email = email;
    if (telefono)
        updateData.telefono = telefono;
    if (consultorio_id) {
        // Validar que el consultorio exista
        const consultorio = await prisma_1.default.consultorio.findUnique({ where: { id: consultorio_id } });
        if (!consultorio) {
            return res.status(400).json({ error: 'Consultorio no encontrado' });
        }
        updateData.consultorio_id = consultorio_id;
    }
    const usuario = await prisma_1.default.usuario.update({
        where: { id },
        data: updateData,
        include: { consultorio: true }
    });
    res.json(usuario);
});
exports.deleteUsuario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.usuario.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
});
