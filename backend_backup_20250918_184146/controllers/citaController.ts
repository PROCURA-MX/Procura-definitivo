import { Request, Response } from 'express';
import prisma from '../prisma';
import * as crypto from 'crypto';
import googleCalendarService from '../services/googleCalendarService';
// import { registrarHistorialCalendario } from '../utils/historialUtils';

export async function getAllCitas(req: Request, res: Response) {
  try {
    // Obtener información del usuario autenticado
    const organizacionId = (req as any).organizationId;
    const userConsultorioId = (req as any).userConsultorioId;
    const userRol = (req as any).user?.rol;
    const consultorioId = req.query.consultorio_id as string;
    
    console.log('🔍 getAllCitas - Filtros:', { organizacionId, userConsultorioId, userRol, consultorioId });
    
    // Construir el objeto where para Prisma
    const whereClause: any = {};
    
    // Filtro por organización
    if (organizacionId) {
      whereClause.pacientes = {
        organizacion_id: organizacionId
      };
    }
    
    // Filtro por consultorio: Los doctores pueden ver todos los consultorios,
    // las enfermeras/secretarias solo ven su consultorio específico
    if (userRol === 'DOCTOR') {
      // Los doctores pueden filtrar por consultorio específico si se especifica
      if (consultorioId && consultorioId !== 'todos') {
        whereClause.consultorio_id = consultorioId;
      }
    } else {
      // Las enfermeras/secretarias solo ven citas de su consultorio
      if (userConsultorioId) {
        whereClause.consultorio_id = userConsultorioId;
        console.log('🔍 getAllCitas - Filtrando por consultorio de usuario:', userConsultorioId);
      }
    }
    
    console.log('🔍 getAllCitas - Where clause:', whereClause);
    
    const citas = await prisma.citas.findMany({
      where: whereClause,
      include: {
        pacientes: true,
        usuarios: true,
        consultorios: true,
      },
      orderBy: { fecha_inicio: 'asc' },
      take: 100
    });
    
    console.log('🔍 getAllCitas - Citas encontradas:', citas.length);
    
    res.json(citas);
  } catch (error: any) {
    console.error('❌ Error en getAllCitas:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function createCita(req: Request, res: Response) {
  try {
    const { fecha_inicio, fecha_fin, descripcion, estado, color, es_recurrente, regla_recurrencia, id_serie, paciente_id, usuario_id, consultorio_id } = req.body;
    
    // Obtener el usuario autenticado
    const authenticatedUser = (req as any).user;
    
    // 🚀 SOLUCIÓN ROBUSTA: Consultar permisos actuales de la base de datos
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: authenticatedUser.id },
      select: {
        id: true,
        email: true,
        rol: true,
        puede_gestionar_calendario: true,
        consultorio_id: true
      }
    });
    
    if (!usuarioActual) {
      console.log(`❌ [createCita] Usuario no encontrado en BD: ${authenticatedUser.id}`);
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log(`🔍 [createCita] Usuario actual: ${usuarioActual.email} (${usuarioActual.rol}), puede_gestionar_calendario: ${usuarioActual.puede_gestionar_calendario}`);
    
    // Validar permisos: Los doctores pueden gestionar calendario por defecto, 
    // las enfermeras/secretarias necesitan el permiso explícito
    if (usuarioActual.rol !== 'DOCTOR' && !usuarioActual.puede_gestionar_calendario) {
      console.log(`❌ [createCita] Usuario ${usuarioActual.email} (${usuarioActual.rol}) no tiene permisos para gestionar el calendario`);
      return res.status(403).json({ 
        error: 'No tienes permisos para gestionar el calendario',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: 'Los doctores pueden gestionar el calendario por defecto. Las enfermeras/secretarias necesitan el permiso puede_gestionar_calendario'
      });
    }
    
    // 🚀 SOLUCIÓN ROBUSTA: Permitir a enfermeras/secretarias crear citas usando disponibilidad del doctor
    let usuarioIdParaCita = usuario_id;
    let doctorIdParaDisponibilidad = usuario_id;
    
    if (usuarioActual.rol !== 'DOCTOR' && usuarioActual.puede_gestionar_calendario) {
      // Para enfermeras/secretarias: usar el doctor del consultorio para disponibilidad
      // pero mantener el usuario_id original para trazabilidad
      if (consultorio_id) {
        const doctorDelConsultorio = await prisma.usuario.findFirst({
          where: {
            consultorio_id: consultorio_id,
            rol: 'DOCTOR'
          },
          select: { id: true }
        });
        
        if (doctorDelConsultorio) {
          doctorIdParaDisponibilidad = doctorDelConsultorio.id;
          console.log(`🔍 [createCita] Enfermera/Secretaria usando doctor del consultorio para disponibilidad: ${doctorDelConsultorio.id}`);
        } else {
          console.log(`⚠️ [createCita] No se encontró doctor en consultorio, usando usuario original: ${usuario_id}`);
        }
      }
    } else if (usuarioActual.rol === 'DOCTOR') {
      // Doctores usan su propio ID
      if (usuario_id !== usuarioActual.id) {
        console.log(`❌ [createCita] Doctor ${usuarioActual.email} intentó crear cita para otro usuario: ${usuario_id}`);
        return res.status(403).json({ 
          error: 'No puedes crear citas para otros usuarios',
          code: 'UNAUTHORIZED_USER_ID',
          details: 'El usuario_id debe coincidir con el usuario autenticado'
        });
      }
    } else {
      // Usuarios sin permisos de calendario
      console.log(`❌ [createCita] Usuario ${usuarioActual.email} (${usuarioActual.rol}) no tiene permisos para gestionar el calendario`);
      return res.status(403).json({ 
        error: 'No tienes permisos para gestionar el calendario',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: 'Los doctores pueden gestionar el calendario por defecto. Las enfermeras/secretarias necesitan el permiso puede_gestionar_calendario'
      });
    }
    
    console.log(`✅ [createCita] Usuario ${usuarioActual.email} (${usuarioActual.rol}) creando cita con permisos válidos`);
    let inicio = fecha_inicio ? new Date(fecha_inicio) : undefined
    let fin = fecha_fin ? new Date(fecha_fin) : undefined
    // Validar disponibilidad y bloqueos solo si hay fecha_inicio, fecha_fin y usuario_id
    if (inicio && fin && doctorIdParaDisponibilidad) {
      const diaSemana = inicio.getDay()
      
      // Usar el doctorIdParaDisponibilidad que ya fue calculado arriba
      const usuarioIdParaDisponibilidad = String(doctorIdParaDisponibilidad);
      
      const disponibilidad = await prisma.disponibilidadMedico.findMany({
        where: {
          usuario_id: usuarioIdParaDisponibilidad,
          dia_semana: diaSemana
        }
      })
      // Validación optimizada - logs removidos para mejor performance
      const estaEnDisponibilidad = disponibilidad.some((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number)
        const [hFin, mFin] = d.hora_fin.split(':').map(Number)
        const slotIni = new Date(inicio)
        slotIni.setHours(hIni, mIni, 0, 0)
        const slotFin = new Date(inicio)
        slotFin.setHours(hFin, mFin, 0, 0)
        return inicio >= slotIni && fin <= slotFin
      })
      if (!estaEnDisponibilidad)
        return res.status(400).json({ error: 'La cita está fuera del horario de disponibilidad del médico para ese día.' })
      // Validar bloqueos
      const bloqueo = await prisma.bloqueoMedico.findFirst({
        where: {
          usuario_id: usuarioIdParaDisponibilidad,
          OR: [
            {
              fecha_inicio: { lte: fin },
              fecha_fin: { gte: inicio }
            }
          ]
        }
      })
      if (bloqueo)
        return res.status(400).json({ error: 'La cita se cruza con un bloqueo del médico.' })
    }
    const estadoValido = estado || 'PROGRAMADA'
    const citaData: any = {
      id: crypto.randomUUID(),
      paciente_id: String(paciente_id),
      usuario_id: String(usuarioIdParaCita), // 🚀 CORREGIDO: Usar el ID correcto para la cita
      consultorio_id: String(consultorio_id),
      fecha_inicio: inicio,
      fecha_fin: fin,
      descripcion: descripcion || null,
      estado: estadoValido as any,
      color: color || "#3B82F6",
      updated_at: new Date(),
    };
    if (typeof es_recurrente !== 'undefined') citaData.es_recurrente = es_recurrente;
    if (typeof regla_recurrencia !== 'undefined') citaData.regla_recurrencia = regla_recurrencia;
    if (typeof id_serie !== 'undefined') citaData.id_serie = id_serie;
    
    // Crear la cita localmente PRIMERO
    const cita = await prisma.citas.create({
      data: citaData,
    });

    // Obtener datos adicionales para el historial
    const paciente = await prisma.paciente.findUnique({
      where: { id: String(paciente_id) }
    });
    
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: String(consultorio_id) }
    });

    // Registrar en historial
    // await registrarHistorialCalendario(
    //   'CREACION',
    //   null,
    //   cita,
    //   String(usuario_id),
    //   cita.id,
    //   {
    //     paciente_id: String(paciente_id),
    //     paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente desconocido',
    //     cita_id: cita.id,
    //     cita_fecha: inicio?.toISOString(),
    //     consultorio_id: String(consultorio_id),
    //     consultorio_nombre: consultorio?.nombre || 'Consultorio desconocido',
    //     estado_nuevo: estadoValido,
    //     motivo_cambio: 'Nueva cita programada'
    //   }
    // );

    // SOLO DESPUÉS de crear la cita exitosamente, intentar sincronizar con Google Calendar
    try {
      // Verificar si el usuario tiene Google Calendar configurado
      const isConnected = await googleCalendarService.isUserConnected(String(usuarioIdParaCita))
      
      if (isConnected) {
        // Obtener datos del paciente y usuario para el evento de Google
        const paciente = await prisma.paciente.findUnique({
          where: { id: String(paciente_id) }
        })
        
        const usuario = await prisma.usuario.findUnique({
          where: { id: String(usuarioIdParaCita) }
        })

        if (paciente && usuario) {
          // Convertir cita a formato de Google Calendar
          const googleEvent = googleCalendarService.convertCitaToGoogleEvent(cita, paciente, usuario)
          
          // Crear evento en Google Calendar
          const googleEventId = await googleCalendarService.createEvent(String(usuarioIdParaCita), googleEvent)
          
          if (googleEventId) {
            console.log(`Cita sincronizada con Google Calendar: ${googleEventId}`)
            // Opcional: Guardar el ID del evento de Google en la cita local
            // await prisma.citas.update({
            //   where: { id: cita.id },
            //   data: { googleEventId: googleEventId }
            // })
          } else {
            console.log('No se pudo sincronizar la cita con Google Calendar, pero la cita local se creó correctamente')
          }
        }
      } else {
        console.log('Usuario no tiene Google Calendar configurado, cita creada solo localmente')
      }
    } catch (syncError) {
      // Si hay error en la sincronización, NO afectar la respuesta de la cita local
      console.error('Error sincronizando con Google Calendar:', syncError)
      console.log('La cita se creó localmente pero no se pudo sincronizar con Google Calendar')
    }

    res.json(cita);
  } catch (error: any) {
    console.error('Error en createCita:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteCita(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Obtener información de la cita antes de eliminarla
    const cita = await prisma.citas.findUnique({
      where: { id },
      include: {
        usuarios: true,
        pacientes: true
      }
    })

    // Registrar en historial antes de eliminar
    // if (cita) {
    //   await registrarHistorialCalendario(
    //     'ELIMINACION',
    //     cita,
    //     { estado: 'ELIMINADO', motivo: 'Cita cancelada' },
    //     cita.usuario_id,
    //     id,
    //     {
    //       paciente_id: cita.paciente_id,
    //       paciente_nombre: cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellido}` : 'Paciente desconocido',
    //       cita_id: id,
    //       cita_fecha: cita.fecha_inicio?.toISOString(),
    //       consultorio_id: cita.consultorio_id,
    //       estado_anterior: cita.estado,
    //       estado_nuevo: 'ELIMINADO',
    //       motivo_cambio: 'Cita cancelada'
    //     }
    //   );
    // }

    // Eliminar la cita localmente PRIMERO
    await prisma.citas.delete({ where: { id } });

    // SOLO DESPUÉS de eliminar exitosamente, intentar sincronizar con Google Calendar
    if (cita) {
      try {
        const isConnected = await googleCalendarService.isUserConnected(cita.usuario_id)
        
        if (isConnected && cita.googleEventId) {
          // Eliminar evento de Google Calendar
          const success = await googleCalendarService.deleteEvent(cita.usuario_id, cita.googleEventId)
          
          if (success) {
            console.log(`Evento eliminado de Google Calendar: ${cita.googleEventId}`)
          } else {
            console.log('No se pudo eliminar el evento de Google Calendar, pero la cita local se eliminó correctamente')
          }
        }
      } catch (syncError) {
        console.error('Error eliminando de Google Calendar:', syncError)
        console.log('La cita se eliminó localmente pero no se pudo eliminar de Google Calendar')
      }
    }

    res.json({ message: 'Cita eliminada' });
  } catch (error: any) {
    res.status(404).json({ error: 'Cita no encontrada' });
  }
}

export async function updateCita(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, descripcion, estado, color, es_recurrente, regla_recurrencia, id_serie, usuario_id } = req.body;
    const updateData: any = {};
    let inicio = fecha_inicio ? new Date(fecha_inicio) : undefined
    let fin = fecha_fin ? new Date(fecha_fin) : undefined
    // Validar disponibilidad y bloqueos solo si hay fecha_inicio, fecha_fin y usuario_id
    if (inicio && fin && usuario_id) {
      const diaSemana = inicio.getDay()
      const disponibilidad = await prisma.disponibilidadMedico.findMany({
        where: {
          usuario_id: String(usuario_id),
          dia_semana: diaSemana
        }
      })
      // Validación optimizada - logs removidos para mejor performance
      const estaEnDisponibilidad = disponibilidad.some((d: { hora_inicio: string; hora_fin: string }) => {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number)
        const [hFin, mFin] = d.hora_fin.split(':').map(Number)
        const slotIni = new Date(inicio)
        slotIni.setHours(hIni, mIni, 0, 0)
        const slotFin = new Date(inicio)
        slotFin.setHours(hFin, mFin, 0, 0)
        return inicio >= slotIni && fin <= slotFin
      })
      if (!estaEnDisponibilidad)
        return res.status(400).json({ error: 'La cita está fuera del horario de disponibilidad del médico para ese día.' })
      // Validar bloqueos (excluyendo la cita actual)
      const bloqueo = await prisma.bloqueoMedico.findFirst({
        where: {
          usuario_id: String(usuario_id),
          OR: [
            {
              fecha_inicio: { lte: fin },
              fecha_fin: { gte: inicio }
            }
          ]
        }
      })
      if (bloqueo)
        return res.status(400).json({ error: 'La cita se cruza con un bloqueo del médico.' })
    }
    if (fecha_inicio) updateData.fecha_inicio = inicio;
    if (fecha_fin) updateData.fecha_fin = fin;
    if (descripcion) updateData.descripcion = descripcion;
    if (estado) updateData.estado = estado;
    if (color) updateData.color = color;
    if (typeof es_recurrente !== 'undefined') updateData.es_recurrente = es_recurrente;
    if (typeof regla_recurrencia !== 'undefined') updateData.regla_recurrencia = regla_recurrencia;
    if (typeof id_serie !== 'undefined') updateData.id_serie = id_serie;
    
    // Obtener la cita actual antes de actualizar para el historial
    const citaAnterior = await prisma.citas.findUnique({
      where: { id },
      include: {
        usuarios: true,
        pacientes: true
      }
    });

    // Actualizar la cita localmente PRIMERO
    const cita = await prisma.citas.update({
      where: { id },
      data: updateData,
      include: {
        usuarios: true,
        pacientes: true
      }
    });

    // Registrar en historial
    // if (citaAnterior) {
    //   await registrarHistorialCalendario(
    //     'EDICION',
    //     citaAnterior,
    //     cita,
    //     cita.usuario_id,
    //     id,
    //     {
    //       paciente_id: cita.paciente_id,
    //       paciente_nombre: cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellido}` : 'Paciente desconocido',
    //       cita_id: id,
    //       cita_fecha: cita.fecha_inicio?.toISOString(),
    //       consultorio_id: cita.consultorio_id,
    //       estado_anterior: citaAnterior.estado,
    //       estado_nuevo: cita.estado,
    //       motivo_cambio: 'Cita actualizada'
    //       }
    //     );
    //   }

    // SOLO DESPUÉS de actualizar exitosamente, intentar sincronizar con Google Calendar
    try {
      const isConnected = await googleCalendarService.isUserConnected(cita.usuario_id)
      
      if (isConnected && cita.googleEventId) {
        // Convertir cita actualizada a formato de Google Calendar
        const googleEvent = googleCalendarService.convertCitaToGoogleEvent(cita, cita.pacientes, cita.usuarios)
        
        // Actualizar evento en Google Calendar
        const success = await googleCalendarService.updateEvent(cita.usuario_id, cita.googleEventId, googleEvent)
        
        if (success) {
          console.log(`Evento actualizado en Google Calendar: ${cita.googleEventId}`)
        } else {
          console.log('No se pudo actualizar el evento en Google Calendar, pero la cita local se actualizó correctamente')
        }
      }
    } catch (syncError) {
      console.error('Error actualizando en Google Calendar:', syncError)
      console.log('La cita se actualizó localmente pero no se pudo actualizar en Google Calendar')
    }

    res.json(cita);
  } catch (error: any) {
    res.status(404).json({ error: 'Cita no encontrada' });
  }
} 
      const isConnected = await googleCalendarService.isUserConnected(cita.usuario_id)
      
      if (isConnected && cita.googleEventId) {
        // Convertir cita actualizada a formato de Google Calendar
        const googleEvent = googleCalendarService.convertCitaToGoogleEvent(cita, cita.pacientes, cita.usuarios)
        
        // Actualizar evento en Google Calendar
        const success = await googleCalendarService.updateEvent(cita.usuario_id, cita.googleEventId, googleEvent)
        
        if (success) {
          console.log(`Evento actualizado en Google Calendar: ${cita.googleEventId}`)
        } else {
          console.log('No se pudo actualizar el evento en Google Calendar, pero la cita local se actualizó correctamente')
        }
      }
    } catch (syncError) {
      console.error('Error actualizando en Google Calendar:', syncError)
      console.log('La cita se actualizó localmente pero no se pudo actualizar en Google Calendar')
    }

    res.json(cita);
  } catch (error: any) {
    res.status(404).json({ error: 'Cita no encontrada' });
  }
} 