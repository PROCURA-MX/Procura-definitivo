import { z } from 'zod';

// ========================================
// ENUMS Y TIPOS BASE
// ========================================

export const TipoCambioEnum = z.enum(['CREACION', 'EDICION', 'ELIMINACION', 'ACTUALIZACION']);
export const EstadoCobroEnum = z.enum(['PENDIENTE', 'COMPLETADO', 'CANCELADO']);
export const MetodoPagoEnum = z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE']);

// ========================================
// SCHEMAS DE VALIDACIÓN BASE
// ========================================

export const createIdSchema = (entityName: string) => z.object({
  id: z.string().uuid(`El ID de ${entityName} debe ser un UUID válido`)
});

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

export const dateRangeSchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional()
});

// ========================================
// SCHEMAS DE USUARIO
// ========================================

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['DOCTOR', 'ENFERMERA', 'SECRETARIA', 'ADMIN']),
  consultorio_id: z.string().uuid('ID de consultorio inválido').optional(),
  organizacion_id: z.string().uuid('ID de organización inválido').optional()
});

export const updateUsuarioSchema = createUsuarioSchema.partial().omit({ password: true });

export const usuarioIdSchema = createIdSchema('usuario');

// ========================================
// SCHEMAS DE PACIENTE
// ========================================

export const createPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().min(10, 'Teléfono inválido').optional(),
  fecha_nacimiento: z.string().optional(),
  direccion: z.string().max(200).optional(),
  organizacion_id: z.string().uuid('ID de organización inválido').optional()
});

export const updatePacienteSchema = createPacienteSchema.partial();

export const pacienteIdSchema = createIdSchema('paciente');

// ========================================
// SCHEMAS DE COBRO
// ========================================

export const createCobroSchema = z.object({
  fecha_cobro: z.string().datetime('Fecha de cobro inválida'),
  monto_total: z.number().positive('El monto debe ser positivo'),
  notas: z.string().max(500).optional(),
  paciente_id: z.string().uuid('ID de paciente inválido'),
  usuario_id: z.string().uuid('ID de usuario inválido'),
  estado: EstadoCobroEnum.default('PENDIENTE'),
  metodo_pago: MetodoPagoEnum.optional()
});

export const updateCobroSchema = createCobroSchema.partial();

export const cobroIdSchema = createIdSchema('cobro');

// ========================================
// SCHEMAS DE HISTORIAL COBRO
// ========================================

export const createHistorialCobroSchema = z.object({
  cobro_id: z.string().uuid('El ID del cobro debe ser un UUID válido'),
  tipo_cambio: TipoCambioEnum,
  descripcion: z.string().min(1, 'La descripción es requerida').optional(),
  usuario_id: z.string().uuid('El ID del usuario debe ser un UUID válido'),
  detalles_antes: z.any().optional(),
  detalles_despues: z.any(),
  organizacion_id: z.string().uuid('ID de organización inválido').optional()
});

export const updateHistorialCobroSchema = createHistorialCobroSchema.partial();

export const historialCobroIdSchema = createIdSchema('historialCobro');

// ========================================
// SCHEMAS DE CONSULTORIO
// ========================================

export const createConsultorioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  direccion: z.string().max(200).optional(),
  telefono: z.string().max(20).optional(),
  organizacion_id: z.string().uuid('ID de organización inválido')
});

export const updateConsultorioSchema = createConsultorioSchema.partial();

export const consultorioIdSchema = createIdSchema('consultorio');

// ========================================
// SCHEMAS DE SERVICIO
// ========================================

export const createServicioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(500).optional(),
  precio_base: z.number().positive('El precio debe ser positivo')
});

export const updateServicioSchema = createServicioSchema.partial();

export const servicioIdSchema = createIdSchema('servicio');

// ========================================
// SCHEMAS DE ORGANIZACIÓN
// ========================================

export const createOrganizacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  ruc: z.string().min(10, 'RUC inválido').max(20),
  direccion: z.string().max(200).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').optional(),
  logo_url: z.string().url('URL de logo inválida').optional(),
  color_primario: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color primario inválido').optional(),
  color_secundario: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color secundario inválido').optional()
});

export const updateOrganizacionSchema = createOrganizacionSchema.partial();

export const organizacionIdSchema = createIdSchema('organizacion');

// ========================================
// SCHEMAS DE FILTROS Y BÚSQUEDA
// ========================================

export const historialFiltrosSchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  usuarioId: z.string().uuid().optional(),
  tipoCambio: TipoCambioEnum.optional(),
  modulo: z.string().optional(),
  ...paginationSchema.shape
});

export const cobroFiltrosSchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  pacienteId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  estado: EstadoCobroEnum.optional(),
  consultorio_id: z.string().optional(),
  ...paginationSchema.shape
});

// ========================================
// SCHEMAS DE AUTENTICACIÓN
// ========================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});

// ========================================
// SCHEMAS DE PERMISOS
// ========================================

export const updatePermisosSchema = z.object({
  puede_gestionar_usuarios: z.boolean().optional(),
  puede_gestionar_calendario: z.boolean().optional(),
  puede_editar_cobros: z.boolean().optional(),
  puede_eliminar_cobros: z.boolean().optional(),
  puede_ver_historial: z.boolean().optional(),
  puede_gestionar_inventario: z.boolean().optional(),
  puede_crear_facturas: z.boolean().optional(),
  puede_ver_facturas: z.boolean().optional()
});

export const updateConfiguracionPermisosSchema = z.object({
  secretaria_editar_cobros: z.boolean().optional(),
  secretaria_eliminar_cobros: z.boolean().optional(),
  enfermera_entradas_inventario: z.boolean().optional(),
  enfermera_salidas_inventario: z.boolean().optional(),
  secretaria_entradas_inventario: z.boolean().optional(),
  secretaria_salidas_inventario: z.boolean().optional()
});

// ========================================
// SCHEMAS DE DISPONIBILIDAD MÉDICO
// ========================================

export const createDisponibilidadMedicoSchema = z.object({
  usuario_id: z.string().uuid('ID de usuario inválido'),
  dia_semana: z.number().min(0).max(6, 'Día de semana inválido'),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de inicio inválida'),
  hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora de fin inválida'),
  activo: z.boolean().default(true)
});

export const updateDisponibilidadMedicoSchema = createDisponibilidadMedicoSchema.partial();

export const disponibilidadMedicoIdSchema = createIdSchema('disponibilidadMedico');

// ========================================
// SCHEMAS DE CITA
// ========================================

export const createCitaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(100),
  descripcion: z.string().max(500).optional(),
  fecha_inicio: z.string().datetime('Fecha de inicio inválida'),
  fecha_fin: z.string().datetime('Fecha de fin inválida'),
  paciente_id: z.string().uuid('ID de paciente inválido'),
  usuario_id: z.string().uuid('ID de usuario inválido'),
  consultorio_id: z.string().uuid('ID de consultorio inválido'),
  estado: z.enum(['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA']).default('PROGRAMADA'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').optional(),
  es_recurrente: z.boolean().default(false),
  regla_recurrencia: z.string().optional()
});

export const updateCitaSchema = createCitaSchema.partial();

export const citaIdSchema = createIdSchema('cita');

// ========================================
// SCHEMAS DE INVENTARIO
// ========================================

export const createProductoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  costPerUnit: z.number().positive('El costo debe ser positivo'),
  unit: z.string().max(20).optional(),
  minStock: z.number().min(0).default(10),
  organizacion_id: z.string().uuid('ID de organización inválido')
});

export const updateProductoSchema = createProductoSchema.partial();

export const productoIdSchema = createIdSchema('producto');

export const createMovementSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT']),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unitCost: z.number().positive('El costo unitario debe ser positivo'),
  totalCost: z.number().positive('El costo total debe ser positivo'),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().optional(),
  consultorioId: z.string().uuid('ID de consultorio inválido').optional(),
  organizacion_id: z.string().uuid('ID de organización inválido')
});

export const updateMovementSchema = createMovementSchema.partial();

export const movementIdSchema = createIdSchema('movement');

// ========================================
// SCHEMAS DE EXPORTACIÓN
// ========================================

export const exportarHistorialSchema = z.object({
  formato: z.enum(['csv', 'json', 'excel']).default('csv'),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  modulo: z.string().optional(),
  incluirDetalles: z.boolean().default(true)
});

// ========================================
// TIPOS EXPORTADOS
// ========================================

export type TipoCambio = z.infer<typeof TipoCambioEnum>;
export type EstadoCobro = z.infer<typeof EstadoCobroEnum>;
export type MetodoPago = z.infer<typeof MetodoPagoEnum>;

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;
export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;

export type CreateCobroInput = z.infer<typeof createCobroSchema>;
export type UpdateCobroInput = z.infer<typeof updateCobroSchema>;

export type CreateHistorialCobroInput = z.infer<typeof createHistorialCobroSchema>;
export type UpdateHistorialCobroInput = z.infer<typeof updateHistorialCobroSchema>;

export type CreateConsultorioInput = z.infer<typeof createConsultorioSchema>;
export type UpdateConsultorioInput = z.infer<typeof updateConsultorioSchema>;

export type CreateServicioInput = z.infer<typeof createServicioSchema>;
export type UpdateServicioInput = z.infer<typeof updateServicioSchema>;

export type CreateOrganizacionInput = z.infer<typeof createOrganizacionSchema>;
export type UpdateOrganizacionInput = z.infer<typeof updateOrganizacionSchema>;

export type HistorialFiltrosInput = z.infer<typeof historialFiltrosSchema>;
export type CobroFiltrosInput = z.infer<typeof cobroFiltrosSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type UpdatePermisosInput = z.infer<typeof updatePermisosSchema>;

export type CreateDisponibilidadMedicoInput = z.infer<typeof createDisponibilidadMedicoSchema>;
export type UpdateDisponibilidadMedicoInput = z.infer<typeof updateDisponibilidadMedicoSchema>;

export type CreateCitaInput = z.infer<typeof createCitaSchema>;
export type UpdateCitaInput = z.infer<typeof updateCitaSchema>;

export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type UpdateMovementInput = z.infer<typeof updateMovementSchema>;

export type ExportarHistorialInput = z.infer<typeof exportarHistorialSchema>;