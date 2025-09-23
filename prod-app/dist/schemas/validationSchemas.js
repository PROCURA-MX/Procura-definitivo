"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportarHistorialSchema = exports.movementIdSchema = exports.updateMovementSchema = exports.createMovementSchema = exports.productoIdSchema = exports.updateProductoSchema = exports.createProductoSchema = exports.citaIdSchema = exports.updateCitaSchema = exports.createCitaSchema = exports.disponibilidadMedicoIdSchema = exports.updateDisponibilidadMedicoSchema = exports.createDisponibilidadMedicoSchema = exports.updateConfiguracionPermisosSchema = exports.updatePermisosSchema = exports.changePasswordSchema = exports.loginSchema = exports.cobroFiltrosSchema = exports.historialFiltrosSchema = exports.organizacionIdSchema = exports.updateOrganizacionSchema = exports.createOrganizacionSchema = exports.servicioIdSchema = exports.updateServicioSchema = exports.createServicioSchema = exports.consultorioIdSchema = exports.updateConsultorioSchema = exports.createConsultorioSchema = exports.historialCobroIdSchema = exports.updateHistorialCobroSchema = exports.createHistorialCobroSchema = exports.cobroIdSchema = exports.updateCobroSchema = exports.createCobroSchema = exports.pacienteIdSchema = exports.updatePacienteSchema = exports.createPacienteSchema = exports.usuarioIdSchema = exports.updateUsuarioSchema = exports.createUsuarioSchema = exports.dateRangeSchema = exports.paginationSchema = exports.createIdSchema = exports.MetodoPagoEnum = exports.EstadoCobroEnum = exports.TipoCambioEnum = void 0;
const zod_1 = require("zod");
// ========================================
// ENUMS Y TIPOS BASE
// ========================================
exports.TipoCambioEnum = zod_1.z.enum(['CREACION', 'EDICION', 'ELIMINACION', 'ACTUALIZACION']);
exports.EstadoCobroEnum = zod_1.z.enum(['PENDIENTE', 'COMPLETADO', 'CANCELADO']);
exports.MetodoPagoEnum = zod_1.z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE']);
// ========================================
// SCHEMAS DE VALIDACIÓN BASE
// ========================================
const createIdSchema = (entityName) => zod_1.z.object({
    id: zod_1.z.string().uuid(`El ID de ${entityName} debe ser un UUID válido`)
});
exports.createIdSchema = createIdSchema;
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().min(0).default(0)
});
exports.dateRangeSchema = zod_1.z.object({
    fechaDesde: zod_1.z.string().optional(),
    fechaHasta: zod_1.z.string().optional()
});
// ========================================
// SCHEMAS DE USUARIO
// ========================================
exports.createUsuarioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    apellido: zod_1.z.string().min(1, 'El apellido es requerido').max(100),
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    rol: zod_1.z.enum(['DOCTOR', 'ENFERMERA', 'SECRETARIA', 'ADMIN']),
    consultorio_id: zod_1.z.string().uuid('ID de consultorio inválido').optional(),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido').optional()
});
exports.updateUsuarioSchema = exports.createUsuarioSchema.partial().omit({ password: true });
exports.usuarioIdSchema = (0, exports.createIdSchema)('usuario');
// ========================================
// SCHEMAS DE PACIENTE
// ========================================
exports.createPacienteSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    apellido: zod_1.z.string().min(1, 'El apellido es requerido').max(100),
    email: zod_1.z.string().email('Email inválido').optional(),
    telefono: zod_1.z.string().min(10, 'Teléfono inválido').optional(),
    fecha_nacimiento: zod_1.z.string().optional(),
    direccion: zod_1.z.string().max(200).optional(),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido').optional()
});
exports.updatePacienteSchema = exports.createPacienteSchema.partial();
exports.pacienteIdSchema = (0, exports.createIdSchema)('paciente');
// ========================================
// SCHEMAS DE COBRO
// ========================================
exports.createCobroSchema = zod_1.z.object({
    fecha_cobro: zod_1.z.string().datetime('Fecha de cobro inválida'),
    monto_total: zod_1.z.number().positive('El monto debe ser positivo'),
    notas: zod_1.z.string().max(500).optional(),
    paciente_id: zod_1.z.string().uuid('ID de paciente inválido'),
    usuario_id: zod_1.z.string().uuid('ID de usuario inválido'),
    estado: exports.EstadoCobroEnum.default('PENDIENTE'),
    metodo_pago: exports.MetodoPagoEnum.optional()
});
exports.updateCobroSchema = exports.createCobroSchema.partial();
exports.cobroIdSchema = (0, exports.createIdSchema)('cobro');
// ========================================
// SCHEMAS DE HISTORIAL COBRO
// ========================================
exports.createHistorialCobroSchema = zod_1.z.object({
    cobro_id: zod_1.z.string().uuid('El ID del cobro debe ser un UUID válido'),
    tipo_cambio: exports.TipoCambioEnum,
    descripcion: zod_1.z.string().min(1, 'La descripción es requerida').optional(),
    usuario_id: zod_1.z.string().uuid('El ID del usuario debe ser un UUID válido'),
    detalles_antes: zod_1.z.any().optional(),
    detalles_despues: zod_1.z.any(),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido').optional()
});
exports.updateHistorialCobroSchema = exports.createHistorialCobroSchema.partial();
exports.historialCobroIdSchema = (0, exports.createIdSchema)('historialCobro');
// ========================================
// SCHEMAS DE CONSULTORIO
// ========================================
exports.createConsultorioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    direccion: zod_1.z.string().max(200).optional(),
    telefono: zod_1.z.string().max(20).optional(),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido')
});
exports.updateConsultorioSchema = exports.createConsultorioSchema.partial();
exports.consultorioIdSchema = (0, exports.createIdSchema)('consultorio');
// ========================================
// SCHEMAS DE SERVICIO
// ========================================
exports.createServicioSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    descripcion: zod_1.z.string().max(500).optional(),
    precio_base: zod_1.z.number().positive('El precio debe ser positivo')
});
exports.updateServicioSchema = exports.createServicioSchema.partial();
exports.servicioIdSchema = (0, exports.createIdSchema)('servicio');
// ========================================
// SCHEMAS DE ORGANIZACIÓN
// ========================================
exports.createOrganizacionSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    ruc: zod_1.z.string().min(10, 'RUC inválido').max(20),
    direccion: zod_1.z.string().max(200).optional(),
    telefono: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email('Email inválido').optional(),
    logo_url: zod_1.z.string().url('URL de logo inválida').optional(),
    color_primario: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Color primario inválido').optional(),
    color_secundario: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Color secundario inválido').optional()
});
exports.updateOrganizacionSchema = exports.createOrganizacionSchema.partial();
exports.organizacionIdSchema = (0, exports.createIdSchema)('organizacion');
// ========================================
// SCHEMAS DE FILTROS Y BÚSQUEDA
// ========================================
exports.historialFiltrosSchema = zod_1.z.object({
    fechaDesde: zod_1.z.string().optional(),
    fechaHasta: zod_1.z.string().optional(),
    usuarioId: zod_1.z.string().uuid().optional(),
    tipoCambio: exports.TipoCambioEnum.optional(),
    modulo: zod_1.z.string().optional(),
    ...exports.paginationSchema.shape
});
exports.cobroFiltrosSchema = zod_1.z.object({
    fechaDesde: zod_1.z.string().optional(),
    fechaHasta: zod_1.z.string().optional(),
    pacienteId: zod_1.z.string().uuid().optional(),
    usuarioId: zod_1.z.string().uuid().optional(),
    estado: exports.EstadoCobroEnum.optional(),
    consultorio_id: zod_1.z.string().optional(),
    ...exports.paginationSchema.shape
});
// ========================================
// SCHEMAS DE AUTENTICACIÓN
// ========================================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida')
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: zod_1.z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});
// ========================================
// SCHEMAS DE PERMISOS
// ========================================
exports.updatePermisosSchema = zod_1.z.object({
    puede_gestionar_usuarios: zod_1.z.boolean().optional(),
    puede_gestionar_calendario: zod_1.z.boolean().optional(),
    puede_editar_cobros: zod_1.z.boolean().optional(),
    puede_eliminar_cobros: zod_1.z.boolean().optional(),
    puede_ver_historial: zod_1.z.boolean().optional(),
    puede_gestionar_inventario: zod_1.z.boolean().optional(),
    puede_crear_facturas: zod_1.z.boolean().optional(),
    puede_ver_facturas: zod_1.z.boolean().optional()
});
exports.updateConfiguracionPermisosSchema = zod_1.z.object({
    secretaria_editar_cobros: zod_1.z.boolean().optional(),
    secretaria_eliminar_cobros: zod_1.z.boolean().optional(),
    enfermera_entradas_inventario: zod_1.z.boolean().optional(),
    enfermera_salidas_inventario: zod_1.z.boolean().optional(),
    secretaria_entradas_inventario: zod_1.z.boolean().optional(),
    secretaria_salidas_inventario: zod_1.z.boolean().optional()
});
// ========================================
// SCHEMAS DE DISPONIBILIDAD MÉDICO
// ========================================
exports.createDisponibilidadMedicoSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().uuid('ID de usuario inválido'),
    dia_semana: zod_1.z.number().min(0).max(6, 'Día de semana inválido'),
    hora_inicio: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de inicio inválida'),
    hora_fin: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de fin inválida'),
    activo: zod_1.z.boolean().default(true)
});
exports.updateDisponibilidadMedicoSchema = exports.createDisponibilidadMedicoSchema.partial();
exports.disponibilidadMedicoIdSchema = (0, exports.createIdSchema)('disponibilidadMedico');
// ========================================
// SCHEMAS DE CITA
// ========================================
exports.createCitaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1, 'El título es requerido').max(100),
    descripcion: zod_1.z.string().max(500).optional(),
    fecha_inicio: zod_1.z.string().datetime('Fecha de inicio inválida'),
    fecha_fin: zod_1.z.string().datetime('Fecha de fin inválida'),
    paciente_id: zod_1.z.string().uuid('ID de paciente inválido'),
    usuario_id: zod_1.z.string().uuid('ID de usuario inválido'),
    consultorio_id: zod_1.z.string().uuid('ID de consultorio inválido'),
    estado: zod_1.z.enum(['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA']).default('PROGRAMADA'),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').optional(),
    es_recurrente: zod_1.z.boolean().default(false),
    regla_recurrencia: zod_1.z.string().optional()
});
exports.updateCitaSchema = exports.createCitaSchema.partial();
exports.citaIdSchema = (0, exports.createIdSchema)('cita');
// ========================================
// SCHEMAS DE INVENTARIO
// ========================================
exports.createProductoSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.string().max(50).optional(),
    costPerUnit: zod_1.z.number().positive('El costo debe ser positivo'),
    unit: zod_1.z.string().max(20).optional(),
    minStock: zod_1.z.number().min(0).default(10),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido')
});
exports.updateProductoSchema = exports.createProductoSchema.partial();
exports.productoIdSchema = (0, exports.createIdSchema)('producto');
exports.createMovementSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('ID de producto inválido'),
    type: zod_1.z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT']),
    quantity: zod_1.z.number().positive('La cantidad debe ser positiva'),
    unitCost: zod_1.z.number().positive('El costo unitario debe ser positivo'),
    totalCost: zod_1.z.number().positive('El costo total debe ser positivo'),
    batchNumber: zod_1.z.string().max(50).optional(),
    expiryDate: zod_1.z.string().datetime().optional(),
    consultorioId: zod_1.z.string().uuid('ID de consultorio inválido').optional(),
    organizacion_id: zod_1.z.string().uuid('ID de organización inválido')
});
exports.updateMovementSchema = exports.createMovementSchema.partial();
exports.movementIdSchema = (0, exports.createIdSchema)('movement');
// ========================================
// SCHEMAS DE EXPORTACIÓN
// ========================================
exports.exportarHistorialSchema = zod_1.z.object({
    formato: zod_1.z.enum(['csv', 'json', 'excel']).default('csv'),
    fechaDesde: zod_1.z.string().optional(),
    fechaHasta: zod_1.z.string().optional(),
    modulo: zod_1.z.string().optional(),
    incluirDetalles: zod_1.z.boolean().default(true)
});
