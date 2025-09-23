"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPacientes = exports.deletePaciente = exports.updatePaciente = exports.createPaciente = exports.getPacienteById = exports.getAllPacientes = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getAllPacientes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // OPTIMIZACIÓN: Agregar paginación para evitar cargar todos los datos
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    // Obtener organizacion_id del usuario autenticado
    const organizacionId = req.tenantFilter?.organizacion_id;
    let pacientes;
    let totalCount;
    if (organizacionId) {
        // OPTIMIZACIÓN: Query con paginación y solo campos necesarios
        const [pacientesData, countData] = await Promise.all([
            prisma_1.default.paciente.findMany({
                where: { organizacion_id: organizacionId },
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    fecha_nacimiento: true,
                    genero: true,
                    telefono: true,
                    email: true,
                    created_at: true,
                    updated_at: true
                },
                orderBy: [
                    { nombre: 'asc' },
                    { apellido: 'asc' }
                ],
                take: limit,
                skip: offset
            }),
            prisma_1.default.paciente.count({
                where: { organizacion_id: organizacionId }
            })
        ]);
        pacientes = pacientesData;
        totalCount = countData;
    }
    else {
        // Comportamiento original con paginación
        const [pacientesData, countData] = await Promise.all([
            prisma_1.default.paciente.findMany({
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    fecha_nacimiento: true,
                    genero: true,
                    telefono: true,
                    email: true,
                    created_at: true,
                    updated_at: true
                },
                orderBy: [
                    { nombre: 'asc' },
                    { apellido: 'asc' }
                ],
                take: limit,
                skip: offset
            }),
            prisma_1.default.paciente.count()
        ]);
        pacientes = pacientesData;
        totalCount = countData;
    }
    // Respuesta directa para mantener compatibilidad con el frontend
    res.json(pacientes);
});
exports.getPacienteById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const paciente = await prisma_1.default.paciente.findUnique({ where: { id } });
    if (!paciente)
        return res.status(404).json({ error: 'Paciente no encontrado' });
    // Traer historial de citas
    const citas = await prisma_1.default.citas.findMany({
        where: { paciente_id: id },
        orderBy: { fecha_inicio: 'desc' },
        include: {
            usuarios: { select: { id: true, nombre: true, apellido: true } },
            consultorios: { select: { id: true, nombre: true } },
        },
    });
    res.json({ ...paciente, citas });
});
exports.createPaciente = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    console.log('Body recibido en createPaciente:', req.body);
    console.log('🔍 Debug - req.tenantFilter:', req.tenantFilter);
    console.log('🔍 Debug - req.organizationId:', req.organizationId);
    console.log('🔍 Debug - req.user:', req.user);
    const { nombre, apellido, fecha_nacimiento, genero, telefono, email } = req.body;
    // Validar campos requeridos
    if (!nombre || !apellido || !fecha_nacimiento || !genero || !telefono || !email) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    // Obtener organizacion_id del usuario autenticado PRIMERO
    const organizacionId = req.tenantFilter?.organizacion_id || req.organizationId || req.user?.organizacion_id;
    console.log('🔍 Debug - organizacionId obtenido:', organizacionId);
    if (!organizacionId) {
        console.log('❌ Error - No se pudo determinar la organización del usuario');
        console.log('❌ Debug - req completo:', JSON.stringify(req, null, 2));
        return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
    }
    // ✅ ARREGLADO: Verificar duplicados por email o teléfono SOLO DENTRO DE LA MISMA ORGANIZACIÓN
    const existing = await prisma_1.default.paciente.findFirst({
        where: {
            organizacion_id: organizacionId, // ✅ CRÍTICO: Solo buscar en la misma organización
            OR: [
                { email: email },
                { telefono: telefono }
            ]
        }
    });
    if (existing) {
        return res.status(400).json({
            error: 'Ya existe un paciente con ese email o teléfono en esta organización.',
            code: 'DUPLICATE_PATIENT_IN_ORGANIZATION',
            details: 'El email y teléfono deben ser únicos dentro de cada organización'
        });
    }
    // Usar SQL directo para evitar problemas de tipos
    const result = await prisma_1.default.$queryRaw `
    INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, genero, telefono, email, organizacion_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${nombre}, ${apellido}, ${new Date(fecha_nacimiento)}, ${genero}, ${telefono}, ${email}, ${organizacionId}::uuid, NOW(), NOW())
    RETURNING *
  `;
    const paciente = result[0];
    res.json(paciente);
});
exports.updatePaciente = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { nombre, fecha_nacimiento, genero, direccion, telefono, email, documento_identidad } = req.body;
    // Obtener organizacion_id del usuario autenticado
    const organizacionId = req.tenantFilter?.organizacion_id || req.organizationId || req.user?.organizacion_id;
    if (!organizacionId) {
        return res.status(400).json({ error: 'No se pudo determinar la organización del usuario' });
    }
    // ✅ ARREGLADO: Verificar duplicados por email o teléfono SOLO DENTRO DE LA MISMA ORGANIZACIÓN
    // Solo validar si se están actualizando email o teléfono
    if (email || telefono) {
        const existing = await prisma_1.default.paciente.findFirst({
            where: {
                organizacion_id: organizacionId, // ✅ CRÍTICO: Solo buscar en la misma organización
                id: { not: id }, // ✅ CRÍTICO: Excluir el paciente actual
                OR: [
                    ...(email ? [{ email: email }] : []),
                    ...(telefono ? [{ telefono: telefono }] : [])
                ]
            }
        });
        if (existing) {
            return res.status(400).json({
                error: 'Ya existe un paciente con ese email o teléfono en esta organización.',
                code: 'DUPLICATE_PATIENT_IN_ORGANIZATION',
                details: 'El email y teléfono deben ser únicos dentro de cada organización'
            });
        }
    }
    const updateData = {};
    if (nombre)
        updateData.nombre = nombre;
    if (fecha_nacimiento)
        updateData.fecha_nacimiento = new Date(fecha_nacimiento);
    if (genero)
        updateData.genero = genero;
    if (direccion)
        updateData.direccion = direccion;
    if (telefono)
        updateData.telefono = telefono;
    if (email)
        updateData.email = email;
    if (documento_identidad)
        updateData.documento_identidad = documento_identidad;
    const paciente = await prisma_1.default.paciente.update({
        where: { id },
        data: updateData,
    });
    res.json(paciente);
});
exports.deletePaciente = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.default.paciente.delete({ where: { id } });
    res.json({ message: 'Paciente eliminado' });
});
exports.searchPacientes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { q } = req.query;
    console.log('🔍 Búsqueda de pacientes - Query:', q);
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
        return res.status(400).json({ error: 'Query demasiado corto' });
    }
    // Obtener organizacion_id del usuario autenticado si está disponible
    const organizacionId = req.tenantFilter?.organizacion_id;
    console.log('🏢 Organización ID:', organizacionId);
    let pacientes;
    if (organizacionId) {
        console.log('🔍 Usando Prisma con filtro de organización');
        // Filtrar por organización usando Prisma
        pacientes = await prisma_1.default.paciente.findMany({
            where: {
                organizacion_id: organizacionId,
                OR: [
                    { nombre: { startsWith: q, mode: 'insensitive' } },
                    { apellido: { startsWith: q, mode: 'insensitive' } },
                ],
            },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
            take: 10,
        });
        console.log('📋 Resultados Prisma con organización:', pacientes);
    }
    else {
        console.log('🔍 Usando Prisma sin filtro de organización');
        // Sin filtro de organización (comportamiento original)
        pacientes = await prisma_1.default.paciente.findMany({
            where: {
                OR: [
                    { nombre: { startsWith: q, mode: 'insensitive' } },
                    { apellido: { startsWith: q, mode: 'insensitive' } },
                ],
            },
            orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
            take: 10,
        });
        console.log('📋 Resultados Prisma:', pacientes);
    }
    res.json(pacientes);
});
