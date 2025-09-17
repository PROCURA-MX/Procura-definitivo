import { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from "react-big-calendar";
import axios from "axios";
import { addDays, addWeeks, addMonths, addMinutes, format, parse, startOfWeek, getDay, isBefore, isAfter, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { TimePicker } from "../components/ui/time-picker";
import PacienteSearch from "../components/PacienteSearch";
import { getPacientes, crearPaciente } from "../services/pacientesService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CalendarMonth from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarBig, dateFnsLocalizer as dateFnsLocalizerBig } from "react-big-calendar";
import { toast } from "react-hot-toast";
import { Toaster } from 'react-hot-toast';
import { format as formatDate, isSameDay } from "date-fns";
import { es as localeEs } from "date-fns/locale";
import { RRule } from 'rrule';
import { useDisponibilidadesMedico } from '../hooks/useDisponibilidadesMedico'
import { useBloqueosMedico } from '../hooks/useBloqueosMedico'
import { useConsultorioContext } from '../contexts/ConsultorioContext'
import GoogleCalendarSync from "../components/GoogleCalendarSync"
import { ModernDatePicker } from "../components/ui/modern-date-picker"
import { NativeDatePicker } from "../components/ui/native-date-picker"
import { ConsultorioSelector } from "../components/ConsultorioSelector"

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventTypes = [
  { value: "primera_vez", label: "Primera vez", color: "#3B82F6" },
  { value: "consulta", label: "Consulta", color: "#10B981" },
  { value: "otros", label: "Otros", color: "#a142f4" },
];

const estadoCitaOptions = [
  { value: "PROGRAMADA", label: "Pendiente", color: "#1b2538" }, // azul oscuro principal
  { value: "EN_CURSO", label: "En curso", color: "#2a3447" }, // tono más claro del principal
  { value: "COMPLETADA", label: "Realizada", color: "#1b2538" }, // mismo color principal
  { value: "CANCELADA", label: "Cancelada", color: "#1b2538" }, // mismo color principal
  { value: "NO_ASISTIO", label: "No asistió", color: "#1b2538" }, // mismo color principal
];

const pacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  genero: z.string().min(1, "El género es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
});

type PacienteForm = z.infer<typeof pacienteSchema>;
type CalendarView = "month" | "week" | "day"

export default function Calendario() {
  const [events, setEvents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    id: "",
    title: "",
    start: new Date(),
    end: addMinutes(new Date(), 30),
    type: "primera_vez",
    descripcion: "",
    paciente: "",
    pacienteId: "",
    telefono: "",
    tipoPersonalizado: "",
    estado: "PROGRAMADA",
    usuario_id: "",
    consultorio_id: "",
  });
  const [error, setError] = useState("");
  const [overlapWarning, setOverlapWarning] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);
  const [date, setDate] = useState(new Date());
  // Cambiar el tipo de view a string
  const [view, setView] = useState<CalendarView>("week"); // Vista por defecto: semana
  const [miniDate, setMiniDate] = useState<Date>(date)
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroPaciente, setFiltroPaciente] = useState<string>("");
  const [filtroConcepto, setFiltroConcepto] = useState<string>("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>("");
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>("");
  const [fechaInicioObj, setFechaInicioObj] = useState<Date | null>(null);
  const [fechaFinObj, setFechaFinObj] = useState<Date | null>(null);
  // Estado para el modal de perfil de paciente
  const [modalPacienteId, setModalPacienteId] = useState<string | null>(null);
  const [modalPaciente, setModalPaciente] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  // Estado para recurrencia
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('weekly');
  const [recurrenceCount, setRecurrenceCount] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener usuario actual (médico)
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
  const usuarioId = user.id
  
  // Contexto de consultorio para manejar selección múltiple
  const { getFilterConsultorioId, shouldShowSelector, consultorios } = useConsultorioContext()
  
  // 🎯 LÓGICA INTELIGENTE: Determinar qué usuario usar para disponibilidad
  const [doctorDelConsultorio, setDoctorDelConsultorio] = useState<any>(null)
  
  const getEffectiveUsuarioId = () => {
    if (user.rol === 'DOCTOR') {
      // Doctores ven su propia disponibilidad
      return usuarioId
    } else {
      // Enfermeras/Secretarias ven la disponibilidad del doctor del consultorio
      return doctorDelConsultorio?.id || null
    }
  }
  
  const effectiveUsuarioId = getEffectiveUsuarioId()
  
  // Obtener doctor del consultorio para enfermeras/secretarias - SOLUCIÓN ROBUSTA ESTILO AMAZON
  useEffect(() => {
    if (user.rol !== 'DOCTOR' && user.consultorio_id) {
      const fetchDoctor = async () => {
        try {
          console.log('🔍 [Calendario] Iniciando búsqueda de doctor para enfermera/secretaria')
          console.log('🔍 [Calendario] Consultorio ID:', user.consultorio_id)
          
          // Obtener token de autenticación
          const token = localStorage.getItem('token')
          if (!token) {
            console.error('❌ [Calendario] No hay token de autenticación')
            return
          }

          console.log('🔍 [Calendario] Haciendo petición al endpoint...')
          const response = await fetch(`/api/consultorios/${user.consultorio_id}/doctor`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          console.log('🔍 [Calendario] Respuesta recibida:', response.status, response.statusText)
          
          if (response.ok) {
            const result = await response.json()
            console.log('🔍 [Calendario] Respuesta completa:', result)
            
            if (result.success && result.data) {
              setDoctorDelConsultorio(result.data)
              console.log('✅ [Calendario] Doctor del consultorio obtenido exitosamente:', result.data)
            } else {
              console.error('❌ [Calendario] Respuesta sin datos válidos:', result)
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ [Calendario] Error obteniendo doctor del consultorio:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            })
            
            // Manejo específico de errores
            if (response.status === 404) {
              console.warn('⚠️ [Calendario] No se encontró doctor en el consultorio')
            } else if (response.status === 401) {
              console.error('❌ [Calendario] Error de autenticación')
            } else if (response.status === 500) {
              console.error('❌ [Calendario] Error interno del servidor')
            }
          }
        } catch (error) {
          console.error('❌ [Calendario] Error de red obteniendo doctor del consultorio:', error)
        }
      }
      
      // Retry con backoff exponencial
      const retryWithBackoff = async (retries = 3, delay = 1000) => {
        try {
          await fetchDoctor()
        } catch (error) {
          if (retries > 0) {
            console.log(`🔄 [Calendario] Reintentando en ${delay}ms... (${retries} intentos restantes)`)
            setTimeout(() => retryWithBackoff(retries - 1, delay * 2), delay)
          } else {
            console.error('❌ [Calendario] Máximo de reintentos alcanzado')
          }
        }
      }
      
      retryWithBackoff()
    }
  }, [user.rol, user.consultorio_id])
  
  const {
    disponibilidades,
    isLoading: isLoadingDispon,
    fetchDisponibilidades,
  } = useDisponibilidadesMedico(effectiveUsuarioId)
  const {
    bloqueos,
    isLoading: isLoadingBloq,
    fetchBloqueos,
  } = useBloqueosMedico(effectiveUsuarioId)
  
  // SOLUCIÓN DEFINITIVA: Forzar actualización de disponibilidades y bloqueos
  useEffect(() => {
    if (effectiveUsuarioId) {
      console.log('🔄 Forzando actualización de disponibilidades y bloqueos para usuario:', effectiveUsuarioId);
      fetchDisponibilidades();
      fetchBloqueos();
    }
  }, [effectiveUsuarioId, fetchDisponibilidades, fetchBloqueos]);

  // SOLUCIÓN ADICIONAL: Polling cada 30 segundos para mantener datos sincronizados
  useEffect(() => {
    if (!effectiveUsuarioId) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Polling: Actualizando disponibilidades y bloqueos para usuario:', effectiveUsuarioId);
      fetchDisponibilidades();
      fetchBloqueos();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [effectiveUsuarioId, fetchDisponibilidades, fetchBloqueos]);

  // Recargar citas cuando cambie el consultorio seleccionado
  useEffect(() => {
    if (user.rol === 'DOCTOR' && shouldShowSelector) {
      console.log('🔄 Consultorio cambiado, recargando citas...');
      cargarEventos();
    }
  }, [getFilterConsultorioId(), shouldShowSelector]);

  // Utilidad para saber si un slot está disponible, bloqueado o fuera de disponibilidad
  function getSlotStatus(date: Date) {
    // 1. Bloqueos
    for (const b of bloqueos) {
      const ini = new Date(b.fecha_inicio)
      const fin = new Date(b.fecha_fin)
      if (date >= ini && date < fin)
        return { status: 'bloqueado', motivo: b.motivo }
    }
    // 2. Disponibilidad
    // CORRECCIÓN: getDay() devuelve 0=Domingo, 1=Lunes, 2=Martes... 
    // En la base de datos también es 0=Domingo, 1=Lunes, 2=Martes...
    const dia = date.getDay() // No necesitamos mapeo, ya coincide
    const hora = date.getHours()
    const minuto = date.getMinutes()
    
    for (const d of disponibilidades) {
      if (d.dia_semana === dia) {
        const [hIni, mIni] = d.hora_inicio.split(':').map(Number)
        const [hFin, mFin] = d.hora_fin.split(':').map(Number)
        // Siempre parte de un objeto Date válido, nunca de un string con espacio
        const ini = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hIni, mIni, 0, 0)
        const fin = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hFin, mFin, 0, 0)
        
        if (date >= ini && date < fin) {
          return { status: 'disponible' }
        }
      }
    }
    // 3. Fuera de disponibilidad
    return { status: 'fuera' }
  }

  // slotPropGetter para colorear los slots
  function slotPropGetter(date: Date) {
    const { status, motivo } = getSlotStatus(date)
    if (status === 'bloqueado')
      return {
        style: {
          background: 'rgba(220, 38, 38, 0.15)', // rojo claro
          cursor: 'not-allowed',
          position: 'relative' as const,
        },
        title: motivo || 'Bloqueo',
      }
    if (status === 'disponible')
      return {
        style: {
          background: 'rgba(16, 185, 129, 0.10)', // verde claro
        },
      }
    return {
      style: {
        background: 'rgba(156, 163, 175, 0.10)', // gris claro
        cursor: 'not-allowed',
      },
      title: 'Fuera de disponibilidad',
    }
  }

  // Interceptar selección de slot para evitar abrir modal en bloqueos o fuera de disponibilidad
  function handleSelectSlotSafe(slotInfo: SlotInfo) {
    const { status, motivo } = getSlotStatus(slotInfo.start)
    if (status === 'bloqueado') {
      toast.error(motivo ? `Bloqueado: ${motivo}` : 'Horario bloqueado')
      return
    }
    if (status === 'fuera') {
      toast.error('Fuera de disponibilidad del médico')
      return
    }
    handleSelectSlot(slotInfo)
  }

  useEffect(() => {
    cargarEventos();
    cargarPacientes();
    setMiniDate(date)
  }, [date]);

  // SOLUCIÓN DEFINITIVA: Refrescar solo cuando cambien las disponibilidades o bloqueos
  useEffect(() => {
    if (usuarioId) {
      console.log('🔄 Disponibilidades o bloqueos cambiaron, refrescando calendario...');
      cargarEventos();
      cargarPacientes();
    }
  }, [disponibilidades, bloqueos, usuarioId]);

  // SOLUCIÓN ADICIONAL: Refrescar cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && usuarioId) {
        console.log('🔄 Página visible, refrescando datos...');
        cargarEventos();
        cargarPacientes();
      }
    };

    const handleFocus = () => {
      if (usuarioId) {
        console.log('🔄 Ventana con focus, refrescando datos...');
        cargarEventos();
        cargarPacientes();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [usuarioId]);

  const cargarEventos = async () => {
    try {
      // Determinar el consultorio para filtrar
      let consultorioId: string | null = null;
      if (user.rol === 'DOCTOR' && shouldShowSelector) {
        const selectedConsultorioId = getFilterConsultorioId();
        if (selectedConsultorioId !== 'todos') {
          consultorioId = selectedConsultorioId;
        }
      }
      
      // Construir la URL con filtro de consultorio si es necesario
      const url = consultorioId 
        ? `/api/citas?consultorio_id=${consultorioId}`
        : "/api/citas";
      
      console.log('🔍 Cargando citas con filtro:', { consultorioId, url });
      
      const res = await axios.get(url);
      const data = res.data;
      
      // Transformar los datos del backend al formato que espera el calendario
      let eventosTransformados: any[] = [];
      data.forEach((cita: any) => {
        // Crear nombre completo del paciente
        const nombreCompleto = cita.pacientes 
          ? `${cita.pacientes.nombre || ''} ${cita.pacientes.apellido || ''}`.trim()
          : '';
        // Mapear el tipo de cita a su label
        const tipoLabel = eventTypes.find(t => t.value === (cita.type || 'consulta'))?.label || '';
        // SIEMPRE mostrar concepto/motivo aunque esté vacío
        let title = nombreCompleto
        if (tipoLabel) title += ` - ${tipoLabel}`
        title += ` - ${cita.descripcion || ''}`
        // Si es recurrente y tiene regla, expandir ocurrencias
        if (cita.es_recurrente && cita.regla_recurrencia) {
          try {
            const rule = RRule.fromString(cita.regla_recurrencia);
            const start = new Date(cita.fecha_inicio);
            const end = new Date(cita.fecha_fin);
            const duration = end.getTime() - start.getTime();
            const dates = rule.all();
            dates.forEach((d: Date, idx: number) => {
              eventosTransformados.push({
                id: cita.id + '_r' + idx,
                title,
                start: d,
                end: new Date(d.getTime() + duration),
                descripcion: cita.descripcion,
                paciente: nombreCompleto,
                pacienteId: cita.paciente_id,
                telefono: cita.pacientes?.telefono || '',
                type: cita.type || 'consulta',
                estado: cita.estado,
                usuario_id: cita.usuario_id,
                consultorio_id: cita.consultorio_id,
                es_recurrente: true,
                id_serie: cita.id_serie,
              });
            });
          } catch (e) {
            // Si falla la regla, mostrar solo la cita original
            eventosTransformados.push({
              id: cita.id,
              title,
              start: new Date(cita.fecha_inicio),
              end: new Date(cita.fecha_fin),
              descripcion: cita.descripcion,
              paciente: nombreCompleto,
              pacienteId: cita.paciente_id,
              telefono: cita.pacientes?.telefono || '',
              type: cita.type || 'consulta',
              estado: cita.estado,
              usuario_id: cita.usuario_id,
              consultorio_id: cita.consultorio_id,
            });
          }
        } else {
          eventosTransformados.push({
            id: cita.id,
            title,
            start: new Date(cita.fecha_inicio),
            end: new Date(cita.fecha_fin),
            descripcion: cita.descripcion,
            paciente: nombreCompleto,
            pacienteId: cita.paciente_id,
            telefono: cita.pacientes?.telefono || '',
            type: cita.type || 'consulta',
            estado: cita.estado,
            usuario_id: cita.usuario_id,
            consultorio_id: cita.consultorio_id,
          });
        }
      });
      
      setEvents(eventosTransformados);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setEvents([]);
    }
  };

  const cargarPacientes = async () => {
    try {
      const data = await getPacientes();
      setPacientes(data);
    } catch (error) {
      // Silenciar error
    }
  };

  // Validar solapamiento
  function checkOverlap(start: Date, end: Date, ignoreId?: string) {
    return events.some(ev =>
      ev.id !== ignoreId &&
      ((isBefore(start, ev.end) && isAfter(end, ev.start)) ||
        (isBefore(ev.start, end) && isAfter(ev.end, start)))
    );
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // Determinar el consultorio automáticamente según el rol y contexto
    let consultorioId = "";
    if (user.rol === 'DOCTOR') {
      if (shouldShowSelector) {
        const selectedConsultorioId = getFilterConsultorioId();
        if (selectedConsultorioId === 'todos') {
          // Doctor en "Todos los consultorios" - auto-seleccionar SOLO si hay 1 consultorio
          if (consultorios.length === 1) {
            // ✅ ARREGLADO: Solo auto-seleccionar si hay exactamente 1 consultorio
            console.log('🔧 [Calendario] AUTO-SELECCIONANDO consultorio (1 solo disponible):', consultorios[0].nombre);
            consultorioId = consultorios[0].id;
          } else {
            // ✅ ARREGLADO: Si hay múltiples consultorios, NO auto-seleccionar
            console.log('🔧 [Calendario] MÚLTIPLES CONSULTORIOS - Forzando selección manual del usuario');
            consultorioId = "";
          }
        } else {
          // Doctor en consultorio específico - usar ese consultorio
          consultorioId = selectedConsultorioId || "";
        }
      } else {
        // Doctor con un solo consultorio
        consultorioId = user.consultorio_id || "";
      }
    } else {
      // Secretaria/Enfermera - usar su consultorio asignado
      consultorioId = user.consultorio_id || "";
    }

    setForm({
      id: "",
      title: "",
      start: slotInfo.start,
      end: slotInfo.end,
      type: "primera_vez",
      descripcion: "",
      paciente: "",
      pacienteId: "",
      telefono: "",
      tipoPersonalizado: "",
      estado: "PROGRAMADA",
      usuario_id: "",
      consultorio_id: consultorioId,
    });
    setError("");
    setEditMode(false);
    setOverlapWarning("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    // Prevenir múltiples envíos
    if (isSubmitting) {
      console.log('Ya se está procesando una cita, ignorando click adicional');
      return;
    }

    if (form.end <= form.start) {
      setError("La hora de fin debe ser mayor a la de inicio");
      return;
    }
    if ((form.type === "primera_vez" || form.type === "consulta") && !form.paciente.trim()) {
      setError("El nombre del paciente es obligatorio para consultas");
      return;
    }
    if (form.type === "otros" && !form.tipoPersonalizado.trim()) {
      setError("Debe especificar el tipo de evento cuando selecciona 'Otros'");
      return;
    }
    
    // Validar consultorio para doctores con múltiples consultorios
    if (user.rol === 'DOCTOR' && shouldShowSelector && !form.consultorio_id) {
      setError("Debe seleccionar un consultorio para crear la cita");
      return;
    }
    if (checkOverlap(form.start, form.end, editMode ? form.id : undefined)) {
      setOverlapWarning("Advertencia: Este evento se solapa con otro existente.");
      return;
    } else {
      setOverlapWarning("");
    }

    setIsSubmitting(true);
    setError("");
    if (editMode) {
      try {
        const res = await axios.put(`/api/citas/${form.id}`, {
          paciente_id: form.pacienteId,
          fecha_inicio: form.start,
          fecha_fin: form.end,
          descripcion: form.descripcion,
          estado: form.estado || "PROGRAMADA",
          color: eventTypes.find(t => t.value === form.type)?.color || "#3B82F6",
          type: form.type,
          usuario_id: form.usuario_id,
          consultorio_id: form.consultorio_id,
        });
        
        // Optimización: Actualizar la cita directamente en el estado
        const citaActualizada = res.data;
        const nombreCompleto = form.paciente;
        const tipoLabel = eventTypes.find(t => t.value === (citaActualizada.type || 'consulta'))?.label || '';
        let title = nombreCompleto;
        if (tipoLabel) title += ` - ${tipoLabel}`;
        title += ` - ${citaActualizada.descripcion || ''}`;
        
        setEvents(prev => prev.map(event => 
          event.id === form.id 
            ? {
                ...event,
                title,
                start: new Date(citaActualizada.fecha_inicio),
                end: new Date(citaActualizada.fecha_fin),
                descripcion: citaActualizada.descripcion,
                paciente: nombreCompleto,
                type: citaActualizada.type || 'consulta',
                estado: citaActualizada.estado,
              }
            : event
        ));
        
        toast.success("Cita actualizada correctamente");
      } catch (error) {
        setError('Error inesperado al actualizar la cita');
        toast.error('Error inesperado al actualizar la cita');
        return;
      }
    } else {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const pacienteId = form.pacienteId;
        
        // Determinar el consultorio a usar
        let consultorioId: string;
        if (user.rol === 'DOCTOR' && shouldShowSelector && form.consultorio_id) {
          // Doctor con múltiples consultorios - usar el seleccionado en el formulario
          consultorioId = form.consultorio_id;
        } else if (user.rol === 'DOCTOR' && shouldShowSelector) {
          // Doctor con múltiples consultorios pero sin selección específica - usar el del contexto
          const selectedConsultorioId = getFilterConsultorioId();
          consultorioId = selectedConsultorioId === 'todos' ? user.consultorio_id : selectedConsultorioId;
        } else {
          // Secretaria/Enfermera o doctor con un solo consultorio - usar el asignado
          consultorioId = user.consultorio_id;
        }
        
        // Usar el ID del usuario actual (enfermera/secretaria/doctor)
        // El backend validará los permisos basándose en puede_gestionar_calendario
        const usuarioId = user.id;
        
        // Log para depuración
        console.log('Datos para crear cita:', { 
          pacienteId, 
          usuarioId, 
          consultorioId, 
          userRol: user.rol,
          shouldShowSelector,
          selectedConsultorio: getFilterConsultorioId(),
          doctorDelConsultorio: doctorDelConsultorio,
          form 
        });
        
        if (!pacienteId || !usuarioId || !consultorioId) {
          setError("Faltan datos de usuario o consultorio. Por favor, vuelve a iniciar sesión.");
          toast.error("Faltan datos de usuario o consultorio. Por favor, vuelve a iniciar sesión.");
          return;
        }
        const payload: any = {
          paciente_id: pacienteId,
          usuario_id: usuarioId,
          consultorio_id: consultorioId,
          fecha_inicio: form.start,
          fecha_fin: form.end,
          descripcion: form.descripcion,
          estado: form.estado || "PROGRAMADA",
          color: eventTypes.find(t => t.value === form.type)?.color || "#3B82F6",
          type: form.type,
        };
        if (isRecurrent) {
          payload.es_recurrente = true;
          // Construir una regla simple tipo RRULE (puedes mejorar esto después)
          let rrule = `FREQ=${recurrenceType.toUpperCase()}`;
          if (recurrenceCount > 1) rrule += `;COUNT=${recurrenceCount}`;
          if (recurrenceEndDate) rrule += `;UNTIL=${recurrenceEndDate.replace(/-/g, '')}T235959Z`;
          payload.regla_recurrencia = rrule;
          payload.id_serie = form.id || undefined;
        }
        const res = await axios.post("/api/citas", payload);
        
        // Optimización: Agregar la nueva cita directamente al estado en lugar de recargar todo
        const nuevaCita = res.data;
        const nombreCompleto = form.paciente;
        const tipoLabel = eventTypes.find(t => t.value === (nuevaCita.type || 'consulta'))?.label || '';
        let title = nombreCompleto;
        if (tipoLabel) title += ` - ${tipoLabel}`;
        title += ` - ${nuevaCita.descripcion || ''}`;
        
        const nuevoEvento = {
          id: nuevaCita.id,
          title,
          start: new Date(nuevaCita.fecha_inicio),
          end: new Date(nuevaCita.fecha_fin),
          descripcion: nuevaCita.descripcion,
          paciente: nombreCompleto,
          pacienteId: nuevaCita.paciente_id,
          telefono: form.telefono || '',
          type: nuevaCita.type || 'consulta',
          estado: nuevaCita.estado,
          usuario_id: nuevaCita.usuario_id,
          consultorio_id: nuevaCita.consultorio_id,
        };
        
        setEvents(prev => [...prev, nuevoEvento]);
        toast.success("Cita creada correctamente");
      } catch (error) {
        setError('Error inesperado al crear la cita');
        toast.error('Error inesperado al crear la cita');
        return;
      }
    }
    setModalOpen(false);
    setIsSubmitting(false);
  };

  const handleSelectEvent = (event: any) => {
    setForm({
      ...event,
      paciente: event.paciente || "",
      telefono: event.telefono || "",
      descripcion: event.descripcion || "",
      tipoPersonalizado: event.tipoPersonalizado || "",
      estado: event.estado || "PROGRAMADA",
      usuario_id: event.usuario_id || "",
      consultorio_id: event.consultorio_id || "",
    });
    setError("");
    setEditMode(true);
    setOverlapWarning("");
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!form.id) return;
    // Si el ID es de evento virtual (cita recurrente expandida), no borrar
    if (form.id.includes('_r')) {
      toast.error('No puedes borrar una instancia individual de una cita recurrente. Edita o elimina la serie completa desde la cita base.')
      setModalOpen(false)
      return;
    }
    try {
      await axios.delete(`/api/citas/${form.id}`);
      
      // Optimización: Remover la cita directamente del estado
      setEvents(prev => prev.filter(event => event.id !== form.id));
      
      toast.success("Cita eliminada correctamente");
      setModalOpen(false);
    } catch (error) {
      setError('Error inesperado al eliminar la cita');
      toast.error('Error inesperado al eliminar la cita');
    }
    setModalOpen(false);
  };

  const eventPropGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    // Oculta eventos en la vista de mes
    if (view === 'month') {
      return { style: { display: 'none' } }
    }
    const estadoColor = estadoCitaOptions.find(e => e.value === event.estado)?.color || '#3B82F6';
    return {
      style: {
        backgroundColor: estadoColor,
        color: '#fff',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1rem',
        padding: '2px 10px',
        margin: '2px 0',
        boxShadow: '0 2px 8px 0 rgba(27,37,56,0.10)',
        border: 'none',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        minHeight: '24px',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: isSelected ? 2 : 1,
      },
      title: event.title || '',
    }
  }

  // Filtro de eventos según estado, paciente, concepto y rango de fechas
  const eventosFiltrados = useMemo(() => {
    return events.filter(ev => {
      if (filtroEstado && ev.estado !== filtroEstado) return false;
      if (filtroPaciente && !ev.paciente?.toLowerCase().includes(filtroPaciente.toLowerCase())) return false;
      if (filtroConcepto && eventTypes.find(t => t.value === ev.type)?.label?.toLowerCase().indexOf(filtroConcepto.toLowerCase()) === -1) return false;
      if (filtroFechaInicio && filtroFechaFin) {
        const inicio = startOfDay(new Date(filtroFechaInicio));
        const fin = endOfDay(new Date(filtroFechaFin));
        if (!isWithinInterval(ev.start, { start: inicio, end: fin })) return false;
      }
      return true;
    });
  }, [events, filtroEstado, filtroPaciente, filtroConcepto, filtroFechaInicio, filtroFechaFin]);

  // Función para abrir el modal y cargar datos
  function handleOpenPacientePerfil(pacienteId: string) {
    setModalPacienteId(pacienteId);
    setModalLoading(true);
    setModalError(null);
    axios.get(`/api/pacientes/${pacienteId}`)
      .then(r => {
        setModalPaciente(r.data);
        setModalLoading(false);
      })
      .catch(err => {
        setModalError("Error al cargar perfil de paciente");
        setModalLoading(false);
      });
  }

  // Utilidad para normalizar fecha a las 00:00:00 locales
  function normalizeToStartOfDay(d: Date) {
    const nd = new Date(d)
    nd.setHours(0, 0, 0, 0)
    return nd
  }

  // Traducción de labels de la toolbar y vistas
  const messages = {
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    allDay: 'Todo el día',
    week: 'Semana',
    work_week: 'Semana laboral',
    day: 'Día',
    month: 'Mes',
    previous: 'Atrás',
    next: 'Siguiente',
    yesterday: 'Ayer',
    tomorrow: 'Mañana',
    today: 'Hoy',
    agenda: 'Agenda',
    noEventsInRange: 'No hay eventos en este rango.',
    showMore: (total: number) => `+ Ver más (${total})`,
  };

  // Traducción de la toolbar (título de la fecha)
  function CustomToolbar({ date, onNavigate, onView, view }: any) {
    // Usar siempre la fecha real seleccionada para el label
    const labelEs = formatDate(date, "EEEE d 'de' MMMM", { locale: localeEs });
    return (
      <div className="rbc-toolbar">
        <div className="flex items-center gap-4">
          <span className="rbc-btn-group">
            <button type="button" onClick={() => onNavigate('TODAY')}>Hoy</button>
            <button type="button" onClick={() => onNavigate('PREV')}>Atrás</button>
            <button type="button" onClick={() => onNavigate('NEXT')}>Siguiente</button>
          </span>
          <span className="rbc-toolbar-label">{labelEs.charAt(0).toUpperCase() + labelEs.slice(1)}</span>
        </div>
        <span className="rbc-btn-group">
          <button type="button" className={view === 'month' ? 'rbc-active' : ''} onClick={() => onView('month')}>Mes</button>
          <button type="button" className={view === 'week' ? 'rbc-active' : ''} onClick={() => onView('week')}>Semana</button>
          <button type="button" className={view === 'day' ? 'rbc-active' : ''} onClick={() => onView('day')}>Día</button>
        </span>
      </div>
    );
  }

  // 1. Render personalizado de eventos: nombre del paciente como enlace para historial, botón de editar aparte
  function renderEvent({ event }: { event: any }) {
    const tipoLabel = eventTypes.find(t => t.value === event.type)?.label || ''
    const estadoColor = estadoCitaOptions.find(e => e.value === event.estado)?.color || '#1b2538'
    return (
      <div className="flex items-center gap-1 h-full px-1 rounded" style={{ background: estadoColor, fontSize: '0.85em', color: '#ffffff', minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        <span
          className="font-bold cursor-pointer hover:underline"
          style={{ lineHeight: '1.2', display: 'inline-block', maxWidth: '90%', color: '#ffffff' }}
          onClick={e => {
            e.stopPropagation();
            handleOpenPacientePerfil(event.pacienteId)
          }}
          title="Ver historial del paciente"
        >
          {event.paciente}
          {tipoLabel && ` - ${tipoLabel}`}
          {event.descripcion && ` - ${event.descripcion}`}
        </span>
        <button
          className="ml-1 text-white/70 hover:text-white p-1 rounded hover:bg-white/20"
          title="Editar cita"
          style={{ lineHeight: '1.2', display: 'inline-block' }}
          onClick={e => {
            e.stopPropagation();
            handleSelectEvent(event)
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M16.475 5.408a2.5 2.5 0 1 1 3.536 3.535L8.5 20.454l-4.243.707.707-4.243L16.475 5.408Z"/></svg>
        </button>
      </div>
    )
  }

  // Handlers para fechas de filtro
  const handleFechaInicioChange = (date: Date | null) => {
    setFechaInicioObj(date);
    if (date) {
      setFiltroFechaInicio(date.toISOString().split('T')[0]);
    } else {
      setFiltroFechaInicio('');
    }
  };

  const handleFechaFinChange = (date: Date | null) => {
    setFechaFinObj(date);
    if (date) {
      setFiltroFechaFin(date.toISOString().split('T')[0]);
    } else {
      setFiltroFechaFin('');
    }
  };

  return (
    <div className="flex w-full h-[85vh] gap-8 items-start justify-center bg-[#f3f6fa] p-6 rounded-2xl shadow-lg">
      <Toaster position="top-right" />
      {/* Mini calendario lateral */}
      <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center">
        <CalendarMonth
          onChange={(d: any) => {
            if (d instanceof Date) {
              setDate(normalizeToStartOfDay(d))
              setMiniDate(normalizeToStartOfDay(d))
            } else if (Array.isArray(d) && d[0] instanceof Date) {
              setDate(normalizeToStartOfDay(d[0]))
              setMiniDate(normalizeToStartOfDay(d[0]))
            }
          }}
          value={miniDate}
          locale="es-MX"
          formatShortWeekday={(locale, date) => {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            return days[date.getDay()]
          }}
          tileClassName={({ date: d }: { date: Date }) =>
            d.toDateString() === new Date().toDateString()
              ? "!bg-[#1b2538] !text-white rounded-full font-bold"
              : ""
          }
          className="border-0 w-[320px] text-lg"
        />
        
        {/* Selector de Consultorio */}
        <div className="w-full mt-4">
          <ConsultorioSelector showLabel={true} />
        </div>
        
        {/* Filtros debajo del mini calendario */}
        <div className="w-full flex flex-col gap-2 mt-6">
          <label className="flex flex-col text-sm font-semibold">
            Estado
            <select
              className="border rounded px-2 py-1 mt-1 text-gray-900 bg-white"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              {estadoCitaOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-semibold">
            Paciente
            <input
              className="border rounded px-2 py-1 mt-1 text-gray-900 bg-white"
              type="text"
              placeholder="Buscar paciente..."
              value={filtroPaciente}
              onChange={e => setFiltroPaciente(e.target.value)}
              list="pacientes-list"
            />
            <datalist id="pacientes-list">
              {pacientes.map(p => (
                <option key={p.id} value={`${p.nombre} ${p.apellido}`.trim()} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col text-sm font-semibold">
            Concepto
            <input
              className="border rounded px-2 py-1 mt-1 text-gray-900 bg-white"
              type="text"
              placeholder="Buscar por tipo de cita..."
              value={filtroConcepto}
              onChange={e => setFiltroConcepto(e.target.value)}
              list="conceptos-list"
            />
            <datalist id="conceptos-list">
              {eventTypes.map(t => (
                <option key={t.value} value={t.label} />
              ))}
            </datalist>
          </label>
          <div className="flex gap-2">
            <label className="flex-1 flex flex-col text-sm font-semibold">
              Desde
              <NativeDatePicker
                selected={fechaInicioObj}
                onChange={handleFechaInicioChange}
                placeholder="Fecha de inicio"
                className="mt-1"
                enableQuickNavigation={true}
                yearRange="both"
              />
            </label>
            <label className="flex-1 flex flex-col text-sm font-semibold">
              Hasta
              <NativeDatePicker
                selected={fechaFinObj}
                onChange={handleFechaFinChange}
                placeholder="Fecha de fin"
                className="mt-1"
                enableQuickNavigation={true}
                yearRange="both"
              />
            </label>
          </div>
          {/* Enlace a bloqueos/disponibilidad */}
          <a
            href="/disponibilidad-bloqueos"
            className="mt-4 block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow"
          >
            Gestionar bloqueos y disponibilidad de médicos
          </a>
          {/* Sincronización con Google Calendar (componente existente) */}
          <div className="w-full mt-6">
            <GoogleCalendarSync />
          </div>
        </div>
      </div>
      {/* Calendario principal */}
      <div className="flex-1">
      <style>{`
          .rbc-calendar {
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            font-size: 1.15rem;
            background: #fff;
            border-radius: 2rem;
            box-shadow: 0 4px 24px 0 rgba(27,37,56,0.10);
            border: 1.5px solid #e5e7eb;
          }
          .rbc-toolbar {
            background: #1b2538;
            border-radius: 2rem 2rem 0 0;
            padding: 1.5rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.35rem;
            color: #fff;
            flex-direction: row;
            gap: 2rem;
          }
          .rbc-toolbar-label {
            font-weight: 600;
            color: #fff;
            font-size: 1.4rem;
          }
          .rbc-toolbar button {
            background: #fff;
            color: #1b2538;
            border: none;
            border-radius: 0;
            padding: 0.4rem 1rem;
            font-weight: 600;
            margin: 0;
            transition: background 0.2s, color 0.2s;
            position: relative;
            font-size: 1.1rem;
          }
          .rbc-toolbar button:first-child {
            border-radius: 0.75rem 0 0 0.75rem;
          }
          .rbc-toolbar button:last-child {
            border-radius: 0 0.75rem 0.75rem 0;
          }
          .rbc-toolbar button.rbc-active, .rbc-toolbar button:focus {
            background: #1b2538;
            color: #fff;
            outline: none;
          }
          .rbc-toolbar button:hover {
            background: #f3f6fa;
            color: #1b2538;
          }
          .rbc-toolbar button.rbc-active:hover {
            background: #1b2538;
            color: #fff;
          }
          .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
            background: #fff;
            border-radius: 0 0 2rem 2rem;
            padding: 1.5rem 2.5rem 2rem 2.5rem;
          }
          .rbc-header {
            background: #f3f6fa;
            color: #223052;
            font-weight: 700;
            font-size: 1.15rem;
            border-bottom: 2px solid #e5e7eb;
            padding: 0.7em 0;
          }
          .rbc-date-cell {
            color: #223052;
            font-weight: 600;
            font-size: 1.1rem;
            padding: 0.3em 0.7em;
          }
          .rbc-off-range {
            background: #f3f4f6;
            color: #b0b0b0;
          }
          .rbc-today {
            background: transparent !important;
          }
          .rbc-date-cell.rbc-now {
            background: none !important;
          }
          .rbc-date-cell.rbc-now > button, .rbc-date-cell.rbc-now > a, .rbc-date-cell.rbc-now > div {
            background: #1b2538 !important;
            color: #fff !important;
            border-radius: 50% !important;
            width: 2.2em;
            height: 2.2em;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
          }
          .rbc-time-header-content, .rbc-timeslot-group {
            background: #f3f6fa;
          }
          .rbc-time-gutter, .rbc-time-header-gutter {
            background: #f3f6fa;
            color: #223052;
            font-size: 1.1rem;
            font-weight: 600;
          }
          .rbc-time-slot {
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
          }
          .rbc-allday-cell {
            background: #f3f6fa;
          }
          .rbc-agenda-view table {
            font-size: 1.1rem;
          }
          .rbc-agenda-date-cell, .rbc-agenda-time-cell {
            font-weight: 600;
          }
          .rbc-agenda-event-cell {
            font-weight: 500;
          }
          .rbc-row-segment, .rbc-agenda-event-cell {
            padding: 0.25rem 0.5rem;
          }
          .rbc-off-range-bg {
            background: #f3f6fa;
          }
          /* Mini calendario: domingos gris, no rojo */
          .react-calendar {
            background: #fff !important;
            border-radius: 2rem !important;
            box-shadow: 0 2px 12px 0 rgba(27,37,56,0.08) !important;
            border: none !important;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif !important;
            font-size: 1.25rem !important;
          }
          .react-calendar__month-view__days__day {
          color: #223052 !important;
            background: transparent !important;
        }
          .react-calendar__tile--active {
            background: #1b2538 !important;
          color: #fff !important;
          border-radius: 50% !important;
        }
          .react-calendar__tile--now {
            background: #e6edfa !important;
            color: #1b2538 !important;
            border-radius: 50% !important;
          }
          .react-calendar__month-view__days__day--weekend {
            color: #b0b7c3 !important;
          }
          .react-calendar__tile {
            border-radius: 50% !important;
          }
          .react-calendar__month-view__weekdays__weekday {
            color: #1b2538 !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
            text-decoration: underline dotted 2px #1b2538 !important;
            text-underline-offset: 3px !important;
            background: #fff !important;
            padding-bottom: 0.2rem !important;
            text-align: center !important;
            min-width: 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
          .react-calendar__navigation {
            background: #fff !important;
            border-radius: 2rem 2rem 0 0 !important;
            margin-bottom: 0.5rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .react-calendar__navigation button {
            background: #f3f6fa !important;
            color: #1b2538 !important;
            font-weight: 700 !important;
            font-size: 1.2rem !important;
            border: none !important;
            border-radius: 0.75rem !important;
            margin: 0 0.2rem !important;
            padding: 0.3rem 1rem !important;
            transition: background 0.2s, color 0.2s;
          }
          .react-calendar__navigation button:disabled {
            opacity: 0.5 !important;
          }

          .react-calendar__month-view__weekdays {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            gap: 2px !important;
            margin-bottom: 8px !important;
        }
          .react-calendar__month-view__days {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            gap: 2px !important;
        }
      `}</style>
        <CalendarBig
            localizer={localizer}
          events={eventosFiltrados}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "75vh", minWidth: 900 }}
            selectable
            onSelectSlot={handleSelectSlotSafe}
          components={{ event: renderEvent, toolbar: CustomToolbar }}
            eventPropGetter={eventPropGetter}
          date={date}
          onNavigate={d => setDate(normalizeToStartOfDay(d))}
          view={view}
          onView={(v) => {
            if (v === "month" || v === "week" || v === "day") setView(v)
          }}
          views={['month', 'week', 'day']}
          messages={messages}
          slotPropGetter={slotPropGetter}
          onSelectEvent={handleSelectEvent}
        />
        {/* Dialog y lógica de eventos permanece igual */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar evento" : "Nuevo evento"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <label className="flex-1 text-sm">
                  Tipo:
                  <select
                    className="w-full border rounded px-2 py-1 mt-1 text-gray-900 bg-white"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {eventTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <label className="flex-1 text-sm">
                  Inicio:
                  <TimePicker
                    value={format(form.start, "HH:mm")}
                    onChange={time => {
                      const [h, m] = time.split(":").map(Number);
                      const newStart = new Date(form.start);
                      newStart.setHours(h, m);
                      setForm(f => ({ ...f, start: newStart }));
                    }}
                    placeholder="Hora de inicio"
                  />
                </label>
                <label className="flex-1 text-sm">
                  Fin:
                  <TimePicker
                    value={format(form.end, "HH:mm")}
                    onChange={time => {
                      const [h, m] = time.split(":").map(Number);
                      const newEnd = new Date(form.end);
                      newEnd.setHours(h, m);
                      setForm(f => ({ ...f, end: newEnd }));
                    }}
                    placeholder="Hora de fin"
                  />
                </label>
              </div>
              {(form.type === "primera_vez" || form.type === "consulta") && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium mb-1">Paciente:</label>
                  <PacienteSearch
                    pacientes={pacientes}
                    onPacienteSelect={p => setForm(f => ({ ...f, paciente: `${p.nombre} ${p.apellido}`, pacienteId: p.id }))}
                    placeholder="Buscar paciente por nombre o apellido..."
                    selectedPacienteId={form.pacienteId}
                  />
                  {/* Botón para ver historial en el modal de edición */}
                  <div className="flex gap-3 mt-1">
                    {form.pacienteId && (
                      <button
                        type="button"
                        className="bg-[#e6edfa] text-[#1b2538] hover:bg-[#cfd8ea] text-xs font-semibold px-3 py-1 rounded transition-colors border border-[#3a4661] hover:border-[#1b2538]"
                        onClick={() => handleOpenPacientePerfil(form.pacienteId)}
                        style={{ minWidth: 140 }}
                      >
                        Ver historial del paciente
                      </button>
                    )}
                  <button
                    type="button"
                      className="bg-[#e6edfa] text-[#1b2538] hover:bg-[#cfd8ea] text-xs font-semibold px-3 py-1 rounded transition-colors border border-[#3a4661] hover:border-[#1b2538]"
                    onClick={() => setShowNuevoPaciente(v => !v)}
                      style={{ minWidth: 140 }}
                  >
                    {showNuevoPaciente ? "Cancelar nuevo paciente" : "Agregar nuevo paciente"}
                  </button>
                  </div>
                  {showNuevoPaciente && (
                    <NuevoPacienteForm
                      onPacienteCreado={async (nuevo) => {
                        await cargarPacientes();
                        setForm(f => ({ ...f, paciente: `${nuevo.nombre} ${nuevo.apellido}`, pacienteId: nuevo.id }));
                        setShowNuevoPaciente(false);
                      }}
                    />
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <label className="flex-1 text-sm">
                  Estado:
                  <select
                    className="w-full border rounded px-2 py-1 mt-1 text-gray-900 bg-white"
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                  >
                    {estadoCitaOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              
              {/* Selector de consultorio solo para doctores con múltiples consultorios */}
              {user.rol === 'DOCTOR' && shouldShowSelector && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Consultorio:</label>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border rounded px-2 py-1 text-gray-900 bg-white"
                      value={form.consultorio_id || getFilterConsultorioId() || ""}
                      onChange={e => setForm(f => ({ ...f, consultorio_id: e.target.value }))}
                      disabled={user.rol === 'DOCTOR' && getFilterConsultorioId() !== 'todos'}
                    >
                      <option value="">Seleccionar consultorio</option>
                      {consultorios.map(consultorio => (
                        <option key={consultorio.id} value={consultorio.id}>
                          {consultorio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <label className="text-sm block">
                Descripción:
                <Input
                  placeholder="Descripción o detalles"
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </label>
              {form.type === "otros" && (
                <label className="text-sm block">
                  Tipo de evento:
                  <Input
                    placeholder="Describe el tipo de evento..."
                    value={form.tipoPersonalizado}
                    onChange={e => setForm(f => ({ ...f, tipoPersonalizado: e.target.value }))}
                    required
                  />
                </label>
              )}
              {/* Dentro del modal de creación/edición de cita, antes del botón de guardar */}
              <div className="col-span-2 flex flex-col gap-2 mt-4 border-t pt-4">
                <label className="flex items-center gap-2 text-lg font-bold text-white">
                  <input
                    type="checkbox"
                    checked={isRecurrent}
                    onChange={e => setIsRecurrent(e.target.checked)}
                    className="w-5 h-5 accent-[#4285f2]"
                  />
                  ¿Cita recurrente?
                </label>
                {isRecurrent && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2">
                    <label className="flex flex-col font-semibold text-white">
                      Frecuencia:
                      <select
                        value={recurrenceType}
                        onChange={e => setRecurrenceType(e.target.value)}
                        className="border rounded px-2 py-2 text-gray-900 bg-white mt-1"
                      >
                        <option value="daily">Diaria</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                        <option value="custom">Personalizada</option>
                      </select>
                    </label>
                    <label className="flex flex-col font-semibold text-white">
                      Repeticiones:
                      <input
                        type="number"
                        min={1}
                        value={recurrenceCount}
                        onChange={e => setRecurrenceCount(Number(e.target.value))}
                        className="border rounded px-2 py-2 w-full text-gray-900 bg-white mt-1"
                      />
                    </label>
                    <label className="flex flex-col font-semibold text-white">
                      Hasta:
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={e => setRecurrenceEndDate(e.target.value)}
                        className="border rounded px-2 py-2 w-full text-gray-900 bg-white mt-1"
                      />
                    </label>
                  </div>
                )}
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {overlapWarning && <div className="text-yellow-600 text-sm">{overlapWarning}</div>}
              <div className="flex justify-between gap-2 mt-2">
                {editMode && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {/* Modal de perfil de paciente */}
        <Dialog open={!!modalPacienteId} onOpenChange={open => { if (!open) setModalPacienteId(null) }}>
          <DialogContent>
            {modalLoading && <div className="p-4">Cargando...</div>}
            {modalError && <div className="p-4 text-red-500">{modalError}</div>}
            {modalPaciente && (
              <div className="p-4 min-w-[350px] max-w-[500px]">
                <div className="text-lg font-bold mb-2">{modalPaciente.nombre} {modalPaciente.apellido}</div>
                <div className="mb-2 text-sm text-gray-600">{modalPaciente.email} | {modalPaciente.telefono}</div>
                <div className="mb-2 text-sm">Nacimiento: {modalPaciente.fecha_nacimiento?.slice(0,10)}</div>
                <div className="mb-4 text-sm">Género: {modalPaciente.genero}</div>
                <div className="font-semibold mb-1">Historial de citas:</div>
                <ul className="max-h-48 overflow-y-auto text-sm">
                  {modalPaciente.citas?.length === 0 && <li className="text-gray-400">Sin citas registradas</li>}
                  {modalPaciente.citas?.map((cita: any) => (
                    <li key={cita.id} className="mb-1 border-b pb-1">
                      <span className="font-bold">{cita.fecha_inicio?.slice(0,16).replace('T',' ')}</span> — <span>{cita.estado}</span>
                      <br />
                      <span className="text-xs">{cita.descripcion}</span>
                      <br />
                      <span className="text-xs text-gray-500">Médico: {cita.usuarios?.nombre} {cita.usuarios?.apellido} | Consultorio: {cita.consultorios?.nombre}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function NuevoPacienteForm({ onPacienteCreado }: { onPacienteCreado: (p: any) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PacienteForm>({ resolver: zodResolver(pacienteSchema) });
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estado controlado para TODOS los campos (sin react-hook-form)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: ''
  });
  
  // Estado controlado para la fecha de nacimiento
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  


  const onSubmit = async (data: PacienteForm) => {
    setErrorMsg("");
    try {
      // Agregar la fecha de nacimiento del estado controlado
      const finalData = {
        ...data,
        fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString().split('T')[0] : ''
      };
      
      const nuevo = await crearPaciente(finalData);
      
      onPacienteCreado(nuevo);
      reset();
      setFechaNacimiento(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        fecha_nacimiento: '',
        genero: ''
      });
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al registrar el paciente");
    }
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="bg-gray-50 rounded-lg p-4 mt-2 flex flex-col gap-2 border"
    >
      <div className="flex gap-2">
        <div className="flex-1">
                      <Input 
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre" 
              className="h-10 text-base text-black bg-white" 
            />
        </div>
        <div className="flex-1">
                      <Input 
              value={formData.apellido}
              onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
              placeholder="Apellido" 
              className="h-10 text-base text-black bg-white" 
            />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
                      <Input 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email" 
              className="h-10 text-base text-black bg-white" 
            />
        </div>
        <div className="flex-1">
                      <Input 
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="Teléfono" 
              className="h-10 text-base text-black bg-white" 
            />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <NativeDatePicker
            selected={fechaNacimiento}
            onChange={setFechaNacimiento}
            placeholder="Fecha de nacimiento"
            className="h-10"
            enableQuickNavigation={true}
            yearRange="past"
          />
          {!fechaNacimiento && <p className="text-red-500 text-xs mt-1">La fecha de nacimiento es requerida</p>}
        </div>
        <div className="flex-1">
                      <select 
              value={formData.genero}
              onChange={(e) => setFormData(prev => ({ ...prev, genero: e.target.value }))}
              className="h-10 text-base border rounded w-full px-2 text-black bg-white"
            >
            <option value="">Género</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>
      </div>
      {errorMsg && <div className="text-red-600 text-xs mb-1">{errorMsg}</div>}
      <div className="flex justify-end mt-2">
        <Button 
          type="button" 
          disabled={isSubmitting} 
          className="h-10 px-6 text-base"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Validación manual
            if (!formData.nombre || !formData.apellido || !fechaNacimiento) {
              setErrorMsg("Por favor completa todos los campos requeridos")
              return
            }
            
            const dataToSubmit = {
              ...formData,
              fecha_nacimiento: fechaNacimiento.toISOString().split('T')[0]
            }
            
            onSubmit(dataToSubmit)
          }}
        >
          Guardar paciente
        </Button>
      </div>
    </div>
  );
} 