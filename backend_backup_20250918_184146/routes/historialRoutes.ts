import express from 'express';
import prisma from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateMultiTenant } from '../middleware/tenantMiddleware';

const router = express.Router();

// 🚀 FUNCIÓN AUXILIAR: Formatear y agregar historial
async function formatAndAddHistorial(
  historialCompleto: any[], 
  historialCobros: any[], 
  historialInventario: any[], 
  historialCalendario: any[], 
  historialUsuarios: any[]
) {
  // Formatear cobros
  historialCobros.forEach(item => {
    historialCompleto.push({
      id: item.id,
      tipo: 'COBRO',
      accion: item.tipo_cambio,
      descripcion: `${item.usuario?.nombre || 'Usuario'} ${item.usuario?.apellido || ''} ${getActionDescription(item.tipo_cambio, 'cobro')}`,
      usuario: item.usuario,
      created_at: item.created_at.toISOString(),
      fecha: item.created_at.toISOString(),
      modulo: 'cobros',
      detalles: {
        cobro_id: item.cobro_id,
        tipo_cambio: item.tipo_cambio,
        estado: 'PENDIENTE',
        monto: '0.00',
        ver_detalle: true
      }
    });
  });

  // Formatear inventario
  historialInventario.forEach(item => {
    historialCompleto.push({
      id: item.id,
      tipo: 'INVENTARIO',
      accion: item.type,
      descripcion: `Movimiento de inventario: ${item.type} - ${item.quantity} unidades`,
      usuario: { nombre: 'Sistema', apellido: 'Inventario', rol: 'SISTEMA' },
      created_at: item.createdAt.toISOString(),
      fecha: item.createdAt.toISOString(),
      modulo: 'inventario',
      detalles: {
        product_id: item.productId,
        type: item.type,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.totalCost,
        ver_detalle: true
      }
    });
  });

  // Formatear calendario
  historialCalendario.forEach(item => {
    historialCompleto.push({
      id: item.id,
      tipo: 'CITA',
      accion: 'CREACION',
      descripcion: `${item.usuarios?.nombre || 'Usuario'} ${item.usuarios?.apellido || ''} creó una nueva cita`,
      usuario: item.usuarios,
      created_at: item.created_at.toISOString(),
      fecha: item.created_at.toISOString(),
      modulo: 'calendario',
      detalles: {
        cita_id: item.id,
        paciente: item.pacientes,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: item.estado,
        ver_detalle: true
      }
    });
  });

  // Formatear usuarios
  historialUsuarios.forEach(item => {
    historialCompleto.push({
      id: item.id,
      tipo: 'USUARIO',
      accion: 'ACTUALIZACION',
      descripcion: `${item.nombre} ${item.apellido} actualizó permisos de usuario`,
      usuario: { nombre: item.nombre, apellido: item.apellido, rol: item.rol },
      created_at: item.updated_at.toISOString(),
      fecha: item.updated_at.toISOString(),
      modulo: 'usuarios',
      detalles: {
        usuario_id: item.id,
        email: item.email,
        rol: item.rol,
        ver_detalle: true
      }
    });
  });
}

// 🚀 FUNCIÓN AUXILIAR: Obtener descripción de acción
function getActionDescription(tipoCambio: string, modulo: string): string {
  switch (tipoCambio) {
    case 'CREACION':
      return modulo === 'cobro' ? 'creó un nuevo cobro' : 'creó un nuevo registro';
    case 'ACTUALIZACION':
      return modulo === 'cobro' ? 'actualizó un cobro' : 'actualizó un registro';
    case 'ELIMINACION':
      return modulo === 'cobro' ? 'eliminó un cobro' : 'eliminó un registro';
    default:
      return `${tipoCambio.toLowerCase()} un registro`;
  }
}

// GET /api/historial/general - Historial general completo
router.get('/general', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, modulo, limit = 50, offset = 0 } = req.query;
    const organizacionId = (req as any).organizationId;
    
    console.log('🔍 DEBUG - Filtros recibidos:', { fechaDesde, fechaHasta, modulo, limit, offset });
    
    if (!organizacionId) {
      return res.status(400).json({
        success: false,
        error: 'organizacionId es requerido'
      });
    }

    // Construir filtros base
    const where: any = {
      organizacion_id: organizacionId // 🔒 FILTRO DE ORGANIZACIÓN
    };
    
    if (fechaDesde && fechaHasta) {
      where.created_at = {
        gte: new Date(fechaDesde as string),
        lte: new Date(fechaHasta as string)
      };
    }

    // 🚀 SOLUCIÓN ROBUSTA: Filtrar por módulo específico
    const historialCompleto: any[] = [];
    
    // Solo obtener historial del módulo especificado, o todos si no se especifica
    if (!modulo || modulo === 'todos') {
      console.log('🔍 DEBUG - Obteniendo historial de TODOS los módulos');
      
      // Obtener historial de cobros - FILTRAR POR ORGANIZACIÓN A TRAVÉS DEL COBRO
      const historialCobros = await prisma.historialCobro.findMany({
        where: {
          // Filtrar por organización a través del cobro -> paciente -> organizacion_id
          cobro: {
            paciente: {
              organizacion_id: organizacionId
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              rol: true
            }
          }
        }
      });

      // Obtener historial de inventario (movements)
      const historialInventario = await prisma.movement.findMany({
        where: { 
          organizacion_id: organizacionId
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      // Obtener historial de calendario (citas)
      const historialCalendario = await prisma.citas.findMany({
        where: { 
          consultorios: {
            organizacion_id: organizacionId
          }
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          usuarios: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              rol: true
            }
          },
          pacientes: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      });

      // Obtener historial de usuarios (cambios de perfil)
      const historialUsuarios = await prisma.usuario.findMany({
        where: { organizacion_id: organizacionId },
        orderBy: { updated_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          created_at: true,
          updated_at: true
        }
      });

      // Formatear y agregar todos los historiales
      await formatAndAddHistorial(historialCompleto, historialCobros, historialInventario, historialCalendario, historialUsuarios);
      
    } else {
      console.log(`🔍 DEBUG - Obteniendo historial SOLO del módulo: ${modulo}`);
      
      switch (modulo) {
        case 'cobros':
          const historialCobros = await prisma.historialCobro.findMany({
            where: {
              // Filtrar por organización a través del cobro -> paciente -> organizacion_id
              cobro: {
                paciente: {
                  organizacion_id: organizacionId
                }
              }
            },
            orderBy: { created_at: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  rol: true
                }
              }
            }
          });
          await formatAndAddHistorial(historialCompleto, historialCobros, [], [], []);
          break;
          
        case 'inventario':
          const historialInventario = await prisma.movement.findMany({
            where: { 
              organizacion_id: organizacionId
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
          });
          await formatAndAddHistorial(historialCompleto, [], historialInventario, [], []);
          break;
          
        case 'calendario':
          const historialCalendario = await prisma.citas.findMany({
            where: { 
              consultorios: {
                organizacion_id: organizacionId
              }
            },
            orderBy: { created_at: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
            include: {
              usuarios: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  rol: true
                }
              },
              pacientes: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          });
          await formatAndAddHistorial(historialCompleto, [], [], historialCalendario, []);
          break;
          
        case 'usuarios':
          const historialUsuarios = await prisma.usuario.findMany({
            where: { organizacion_id: organizacionId },
            orderBy: { updated_at: 'desc' },
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              rol: true,
              created_at: true,
              updated_at: true
            }
          });
          await formatAndAddHistorial(historialCompleto, [], [], [], historialUsuarios);
          break;
          
        default:
          console.log(`⚠️ DEBUG - Módulo no reconocido: ${modulo}`);
          break;
      }
    }

    // Ordenar por fecha descendente
    historialCompleto.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`🔍 DEBUG - Historial completo encontrado: ${historialCompleto.length} registros`);
    console.log(`🔍 DEBUG - Historial paginado: ${Math.min(historialCompleto.length, parseInt(limit as string))} registros`);

    res.json({
      success: true,
      data: historialCompleto,
      pagination: {
        page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        limit: parseInt(limit as string),
        total: historialCompleto.length,
        pages: Math.ceil(historialCompleto.length / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('❌ Error en historial general:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// GET /api/historial/estadisticas - Estadísticas simplificadas
router.get('/estadisticas', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const organizacionId = (req as any).organizationId;
    
    if (!organizacionId) {
      return res.status(400).json({
        success: false,
        error: 'organizacionId es requerido'
      });
    }

    // Estadísticas de cobros
    const totalCobros = await prisma.historialCobro.count();

    const cobrosHoy = await prisma.historialCobro.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const cobrosEstaSemana = await prisma.historialCobro.count({
      where: {
        created_at: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7))
        }
      }
    });

    // Usuarios más activos (simplificado)
    const usuariosActivos = await prisma.historialCobro.findMany({
      select: {
        usuario_id: true,
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            rol: true
          }
        }
      },
      distinct: ['usuario_id'],
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    const usuariosConNombres = usuariosActivos.map(user => ({
      id: user.usuario_id,
      nombre: user.usuario?.nombre || 'Desconocido',
      apellido: user.usuario?.apellido || '',
      rol: user.usuario?.rol || 'USUARIO',
      acciones: 1
    }));

    res.json({
      success: true,
      data: {
        totales: {
          cobros: totalCobros,
          movimientos: 0,
          total: totalCobros
        },
        hoy: {
          cobros: cobrosHoy,
          movimientos: 0,
          total: cobrosHoy
        },
        estaSemana: {
          cobros: cobrosEstaSemana,
          movimientos: 0,
          total: cobrosEstaSemana
        },
        usuariosActivos: usuariosConNombres
      }
    });

  } catch (error) {
    console.error('❌ Error en estadísticas de historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// GET /api/historial/buscar - Búsqueda simplificada
router.get('/buscar', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    const organizacionId = (req as any).organizationId;
    
    if (!organizacionId) {
      return res.status(400).json({
        success: false,
        error: 'organizacionId es requerido'
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Término de búsqueda requerido'
      });
    }

    // Buscar en historial de cobros
    const cobros = await prisma.historialCobro.findMany({
      where: {
        OR: [
          { tipo_cambio: { equals: query as any } }
        ]
      },
      take: parseInt(limit as string),
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Formatear resultados
    const resultados = cobros.map(item => ({
      id: item.id,
      tipo: 'COBRO',
      modulo: 'cobros',
      descripcion: `Cobro ${item.tipo_cambio.toLowerCase()}`,
      usuario: { nombre: 'Usuario', apellido: 'Sistema' },
      fecha: item.created_at,
      accion: item.tipo_cambio
    }));

    res.json({
      success: true,
      data: resultados
    });

  } catch (error) {
    console.error('❌ Error en búsqueda de historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// Ruta específica para historial de inventario
router.get('/inventario', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const organizacionId = (req as any).organizationId;

    console.log('🔍 DEBUG - Obteniendo historial de inventario...');

    // Obtener historial de inventario (movements)
    const historialInventario = await prisma.movement.findMany({
      where: { organizacion_id: organizacionId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Obtener usuarios para los movimientos
    const userIds = [...new Set(historialInventario.map(item => item.userId))];
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rol: true
      }
    });

    const usuariosMap = new Map(usuarios.map(u => [u.id, u]));

    // Formatear inventario
    const historialFormateado = historialInventario.map(item => {
      const usuario = usuariosMap.get(item.userId);
      return {
        id: item.id,
        tipo: 'INVENTARIO',
        accion: item.type === 'ENTRY' ? 'ENTRADA' : 'SALIDA',
        descripcion: `${item.type === 'ENTRY' ? 'Entrada' : 'Salida'} de ${item.quantity.toString()} unidades de producto`,
        usuario: usuario || {
          id: item.userId,
          nombre: 'Usuario',
          apellido: 'Sistema',
          rol: 'USUARIO'
        },
        created_at: item.createdAt.toISOString(),
        fecha: item.createdAt.toISOString(),
        modulo: 'inventario',
        detalles: {
          producto_id: item.productId,
          producto_nombre: 'Producto',
          cantidad: item.quantity.toString(),
          tipo: item.type,
          costo_unitario: item.unitCost?.toString(),
          costo_total: item.totalCost?.toString()
        }
      };
    });

    res.json({
      success: true,
      data: historialFormateado,
      pagination: {
        total: historialFormateado.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// Ruta específica para historial de calendario
router.get('/calendario', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const organizacionId = (req as any).organizationId;

    console.log('🔍 DEBUG - Obteniendo historial de calendario...');

    // Obtener historial de calendario (citas)
    const historialCalendario = await prisma.citas.findMany({
      where: { 
        consultorios: {
          organizacion_id: organizacionId
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            rol: true
          }
        },
        pacientes: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Formatear calendario
    const historialFormateado = historialCalendario.map(item => ({
      id: item.id,
      tipo: 'CITA',
      accion: 'CREACION',
      descripcion: `Cita "${item.titulo || 'Sin título'}" creada para ${item.pacientes?.nombre} ${item.pacientes?.apellido}`,
      usuario: item.usuarios || {
        id: item.usuario_id,
        nombre: 'Usuario',
        apellido: 'Sistema',
        rol: 'USUARIO'
      },
      created_at: item.created_at.toISOString(),
      fecha: item.created_at.toISOString(),
      modulo: 'calendario',
      detalles: {
        paciente_id: item.paciente_id,
        paciente_nombre: `${item.pacientes?.nombre} ${item.pacientes?.apellido}`,
        fecha_cita: item.fecha_inicio?.toISOString(),
        titulo: item.titulo,
        estado: item.estado,
        consultorio_id: item.consultorio_id
      }
    }));

    res.json({
      success: true,
      data: historialFormateado,
      pagination: {
        total: historialFormateado.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// Ruta específica para historial de usuarios
router.get('/usuarios', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const organizacionId = (req as any).organizationId;

    console.log('🔍 DEBUG - Obteniendo historial de usuarios...');

    // Obtener historial de usuarios (cambios de perfil)
    const historialUsuarios = await prisma.usuario.findMany({
      where: { organizacion_id: organizacionId },
      orderBy: { updated_at: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        created_at: true,
        updated_at: true
      }
    });

    // Formatear usuarios
    const historialFormateado = historialUsuarios.map(item => ({
      id: item.id,
      tipo: 'USUARIO',
      accion: item.created_at.getTime() === item.updated_at.getTime() ? 'CREACION' : 'ACTUALIZACION',
      descripcion: item.created_at.getTime() === item.updated_at.getTime() 
        ? `Usuario ${item.nombre} ${item.apellido} creado con rol ${item.rol}`
        : `Perfil de ${item.nombre} ${item.apellido} actualizado`,
      usuario: {
        id: item.id,
        nombre: item.nombre,
        apellido: item.apellido,
        rol: item.rol
      },
      created_at: item.updated_at.toISOString(),
      fecha: item.updated_at.toISOString(),
      modulo: 'usuarios',
      detalles: {
        usuario_id: item.id,
        email: item.email,
        rol: item.rol,
        fecha_creacion: item.created_at.toISOString(),
        fecha_actualizacion: item.updated_at.toISOString()
      }
    }));

    res.json({
      success: true,
      data: historialFormateado,
      pagination: {
        total: historialFormateado.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

export default router;

    // Formatear calendario
    const historialFormateado = historialCalendario.map(item => ({
      id: item.id,
      tipo: 'CITA',
      accion: 'CREACION',
      descripcion: `Cita "${item.titulo || 'Sin título'}" creada para ${item.pacientes?.nombre} ${item.pacientes?.apellido}`,
      usuario: item.usuarios || {
        id: item.usuario_id,
        nombre: 'Usuario',
        apellido: 'Sistema',
        rol: 'USUARIO'
      },
      created_at: item.created_at.toISOString(),
      fecha: item.created_at.toISOString(),
      modulo: 'calendario',
      detalles: {
        paciente_id: item.paciente_id,
        paciente_nombre: `${item.pacientes?.nombre} ${item.pacientes?.apellido}`,
        fecha_cita: item.fecha_inicio?.toISOString(),
        titulo: item.titulo,
        estado: item.estado,
        consultorio_id: item.consultorio_id
      }
    }));

    res.json({
      success: true,
      data: historialFormateado,
      pagination: {
        total: historialFormateado.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

// Ruta específica para historial de usuarios
router.get('/usuarios', authenticateMultiTenant, asyncHandler(async (req, res) => {
  try {
    const { limit = '50', offset = '0' } = req.query;
    const organizacionId = (req as any).organizationId;

    console.log('🔍 DEBUG - Obteniendo historial de usuarios...');

    // Obtener historial de usuarios (cambios de perfil)
    const historialUsuarios = await prisma.usuario.findMany({
      where: { organizacion_id: organizacionId },
      orderBy: { updated_at: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        created_at: true,
        updated_at: true
      }
    });

    // Formatear usuarios
    const historialFormateado = historialUsuarios.map(item => ({
      id: item.id,
      tipo: 'USUARIO',
      accion: item.created_at.getTime() === item.updated_at.getTime() ? 'CREACION' : 'ACTUALIZACION',
      descripcion: item.created_at.getTime() === item.updated_at.getTime() 
        ? `Usuario ${item.nombre} ${item.apellido} creado con rol ${item.rol}`
        : `Perfil de ${item.nombre} ${item.apellido} actualizado`,
      usuario: {
        id: item.id,
        nombre: item.nombre,
        apellido: item.apellido,
        rol: item.rol
      },
      created_at: item.updated_at.toISOString(),
      fecha: item.updated_at.toISOString(),
      modulo: 'usuarios',
      detalles: {
        usuario_id: item.id,
        email: item.email,
        rol: item.rol,
        fecha_creacion: item.created_at.toISOString(),
        fecha_actualizacion: item.updated_at.toISOString()
      }
    }));

    res.json({
      success: true,
      data: historialFormateado,
      pagination: {
        total: historialFormateado.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}));

export default router;
