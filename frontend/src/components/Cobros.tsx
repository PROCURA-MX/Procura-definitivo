import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { useForm, useFieldArray as useFieldArrayRH } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConceptos } from "../hooks/useConceptos";
import { crearCobro, agregarConceptoACobro, getPacientes, getUsuarios, getConsultorios, eliminarCobro, editarCobro } from "../services/cobrosService";
import { useCobros } from "../hooks/useCobros";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useConsultorioContext } from "../contexts/ConsultorioContext";
import PacienteSearch from "./PacienteSearch";
import TableFilters from "./TableFilters";
import { exportToPDF, exportToExcel, formatCobrosForExport } from "../services/exportService";
import ConceptoSearch from "./ConceptoSearch";
import facturacionService from "../services/facturacionService";

const conceptoSchema = z.object({
  conceptoId: z.string().min(1, "Selecciona un concepto"),
  precio_unitario: z.string().or(z.number()),
  cantidad: z.string().or(z.number()),
});

const cobroSchema = z.object({
  paciente: z.string().min(1, "El paciente es requerido"),
  fecha: z.string().min(1, "La fecha es requerida"),
  conceptos: z.array(conceptoSchema).min(1, "Agrega al menos un concepto"),
  pidioFactura: z.boolean().optional(),
  usuario: z.string().min(1, "El usuario es requerido"),
  consultorio: z.string().min(1, "El consultorio es requerido"),
  pagos: z.array(z.object({
    metodo: z.string().min(1, "Selecciona un método de pago"),
    monto: z.string().or(z.number()).refine(val => Number(val) > 0, "El monto es requerido"),
  })).min(1, "Agrega al menos un método de pago"),
});

type CobroForm = z.infer<typeof cobroSchema>;

function getToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

type PeriodoFiltro = 'hoy' | 'semana' | 'mes' | 'año' | 'personalizado';

interface CobrosProps {
  embedded?: boolean;
  periodoFiltro?: PeriodoFiltro;
  fechaInicio?: string;
  fechaFin?: string;
}

export default function Cobros({ embedded = false, periodoFiltro, fechaInicio, fechaFin }: CobrosProps) {
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { servicios, isLoading: loading } = useConceptos();
  const { currentUser, loading: userLoading, error: userError } = useCurrentUser();
  const { getFilterConsultorioId } = useConsultorioContext();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CobroForm>({
    resolver: zodResolver(cobroSchema),
    defaultValues: {
      paciente: "",
      fecha: getToday(),
      conceptos: [
        { conceptoId: servicios[0]?.id ?? "", precio_unitario: servicios[0]?.precio_base?.toString() ?? "0", cantidad: "1" } as { conceptoId: string; precio_unitario: string | number; cantidad: string | number },
      ],
      pagos: [{ metodo: "", monto: "" }],
    },
  });

  const { fields, append, remove, update } = useFieldArrayRH({
    control,
    name: "conceptos",
  });

  const {
    fields: pagoFields,
    append: appendPago,
    remove: removePago,
  } = useFieldArrayRH({
    control,
    name: "pagos",
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [filteredCobros, setFilteredCobros] = useState<any[]>([]);
  const [cobrosFiltradosPorFecha, setCobrosFiltradosPorFecha] = useState<any[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [estadoCobro, setEstadoCobro] = useState('PENDIENTE');
  const [editCobro, setEditCobro] = useState<any>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes'>('todos');

  // Filtrar cobros por estado
  const cobrosFiltradosPorEstado = filteredCobros.filter(cobro => {
    if (filtroEstado === 'pendientes') {
      return cobro.estado === 'PENDIENTE';
    }
    return true; // 'todos'
  });

  const cobrosPendientes = filteredCobros.filter(cobro => cobro.estado === 'PENDIENTE');
  const totalPendientes = cobrosPendientes.reduce((sum, cobro) => sum + (cobro.monto_total || 0), 0);

  // Usar el hook de cobros con filtro de consultorio
  const consultorioId = getFilterConsultorioId();
  const { cobros, isLoading: cobrosLoading, create: createCobro, update: updateCobro, remove: removeCobro, fetchCobros } = useCobros(consultorioId);

  // Re-ejecutar cuando cambie el consultorio
  useEffect(() => {
    console.log('🔄 Consultorio cambiado en Cobros, recargando cobros...');
    fetchCobros();
  }, [consultorioId, fetchCobros]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pacientesData, usuariosData, consultoriosData] = await Promise.all([
          getPacientes(),
          getUsuarios(),
          getConsultorios()
        ]);
        
        setPacientes(pacientesData);
        setUsuarios(usuariosData);
        setConsultorios(consultoriosData);
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      }
    };
    
    loadData();
  }, []);

  // Pre-llenar automáticamente usuario y consultorio cuando se carguen los datos
  useEffect(() => {
    if (currentUser && !userLoading) {
      console.log('🔄 Pre-llenando campos con usuario actual:', currentUser);
      
      // Pre-llenar usuario
      setValue("usuario", currentUser.id);
      
      // Pre-llenar consultorio solo si NO es doctor (secretarias y enfermeras tienen consultorio fijo)
      if (currentUser.consultorio_id && currentUser.rol !== 'DOCTOR') {
        setValue("consultorio", currentUser.consultorio_id);
      }
    }
  }, [currentUser, userLoading, setValue]);

  // ✅ AUTO-SELECCIONAR consultorio para doctores cuando hay solo 1 consultorio disponible
  useEffect(() => {
    if (currentUser && currentUser.rol === 'DOCTOR' && consultorios.length > 0) {
      const selectedConsultorioId = getFilterConsultorioId();
      
      // Solo aplicar auto-selección si está en "todos los consultorios" y hay exactamente 1 consultorio
      if (selectedConsultorioId === 'todos' && consultorios.length === 1) {
        const currentConsultorioValue = watch("consultorio");
        
        // Solo auto-seleccionar si no hay un valor ya seleccionado
        if (!currentConsultorioValue) {
          console.log('🔧 [Cobros] AUTO-SELECCIONANDO consultorio (1 solo disponible):', consultorios[0].nombre);
          setValue("consultorio", consultorios[0].id);
        }
      } else if (selectedConsultorioId === 'todos' && consultorios.length > 1) {
        // ✅ ARREGLADO: Si hay múltiples consultorios, NO auto-seleccionar
        console.log('🔧 [Cobros] MÚLTIPLES CONSULTORIOS - Forzando selección manual del usuario');
        const currentConsultorioValue = watch("consultorio");
        if (currentConsultorioValue) {
          setValue("consultorio", ""); // Limpiar selección para forzar selección manual
        }
      }
    }
  }, [currentUser, consultorios, getFilterConsultorioId, setValue, watch]);

  // Actualizar filteredCobros cuando cambien los cobros o el filtro global
  useEffect(() => {
    if (!periodoFiltro) {
      setFilteredCobros(cobros);
      return;
    }

    const getFechasFiltro = () => {
      const hoy = new Date();
      let inicio = new Date();
      let fin = new Date();

      switch (periodoFiltro) {
        case 'hoy':
          // Para "hoy" usamos la fecha actual en zona horaria local
          const hoyLocal = new Date();
          const year = hoyLocal.getFullYear();
          const month = hoyLocal.getMonth();
          const day = hoyLocal.getDate();
          
          // Inicio del día en zona horaria local
          inicio = new Date(year, month, day, 0, 0, 0, 0);
          
          // Fin del día en zona horaria local
          fin = new Date(year, month, day, 23, 59, 59, 999);
          break;
        case 'semana':
          inicio = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'mes':
          inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
          break;
        case 'año':
          inicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
          break;
        case 'personalizado':
          if (fechaInicio && fechaFin) {
            inicio = new Date(fechaInicio);
            fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
          }
          break;
      }

      return { inicio, fin };
    };

    const { inicio, fin } = getFechasFiltro();
    
    console.log('🔍 DEBUG FILTRO COBROS:');
    console.log('📅 Período filtro:', periodoFiltro);
    console.log('📅 Fecha inicio:', inicio);
    console.log('📅 Fecha fin:', fin);
    console.log('📋 Total cobros:', cobros.length);
    console.log('📋 Fechas de cobros:', cobros.map(c => ({ id: c.id, fecha: c.fecha_cobro, paciente: (c as any).paciente?.nombre })));
    
    // Aplicar filtro de fecha global
    const cobrosFiltradosPorFecha = cobros.filter(c => {
      if (!c.fecha_cobro) return false;
      
      // Extraer solo la fecha (YYYY-MM-DD) del cobro
      const fechaCobroString = c.fecha_cobro.split('T')[0]; // "2025-08-22"
      
      // Extraer solo la fecha del filtro de inicio
      const fechaInicioString = inicio.toISOString().split('T')[0]; // "2025-08-22"
      
      // Para el filtro "hoy", comparar solo las fechas como strings
      if (periodoFiltro === 'hoy') {
        const cumpleFiltro = fechaCobroString === fechaInicioString;
        console.log(`📅 Cobro ${c.id}: ${c.fecha_cobro} -> ${fechaCobroString} vs ${fechaInicioString} (cumple: ${cumpleFiltro})`);
        return cumpleFiltro;
      }
      
      // Para otros filtros, usar la lógica original
      const fechaCobro = new Date(c.fecha_cobro);
      const cumpleFiltro = fechaCobro >= inicio && fechaCobro <= fin;
      
      console.log(`📅 Cobro ${c.id}: ${c.fecha_cobro} -> ${fechaCobro.toDateString()} (cumple: ${cumpleFiltro})`);
      
      return cumpleFiltro;
    });

    console.log('✅ Cobros filtrados:', cobrosFiltradosPorFecha.length);

    setCobrosFiltradosPorFecha(cobrosFiltradosPorFecha);
    setFilteredCobros(cobrosFiltradosPorFecha);
  }, [cobros, periodoFiltro, fechaInicio, fechaFin]);

  const refreshCobros = async () => {
    console.log('🔄 Refrescando cobros...');
    try {
      // Forzar la recarga de cobros usando el hook
      await fetchCobros();
      
      // Recargar datos de pacientes, usuarios y consultorios también
      const [pacientesData, usuariosData, consultoriosData] = await Promise.all([
        getPacientes(),
        getUsuarios(),
        getConsultorios()
      ]);
      
      setPacientes(pacientesData);
      setUsuarios(usuariosData);
      setConsultorios(consultoriosData);
      
      console.log('✅ Datos recargados exitosamente');
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
    }
  };

  const handleFiltersChange = (filters: {
    pacienteId?: string;
  }) => {
    let filtered = [...cobrosFiltradosPorFecha]; // Usar cobrosFiltradosPorFecha que ya tiene el filtro de fecha global

    if (filters.pacienteId) {
      filtered = filtered.filter(c => c.paciente_id === filters.pacienteId);
    }

    setFilteredCobros(filtered);
  };

  const handleExportPDF = async () => {
    const exportData = formatCobrosForExport(filteredCobros);
    await exportToPDF(exportData);
  };

  const handleExportExcel = async () => {
    const exportData = formatCobrosForExport(filteredCobros);
    await exportToExcel(exportData);
  };

  const calcularSubtotal = (concepto: any) => {
    const precio = parseFloat(String(concepto.precio_unitario ?? "0"));
    const cantidad = parseInt(String(concepto.cantidad ?? "1"));
    return precio * cantidad;
  };

  const calcularTotal = () => {
    return fields.reduce((total, field, idx) => {
      const precio = parseFloat(String(watch(`conceptos.${idx}.precio_unitario`) ?? servicios.find(s => s.id === field.conceptoId)?.precio_base ?? 0));
      const cantidad = parseInt(String(watch(`conceptos.${idx}.cantidad`) ?? 1));
      return total + (precio * cantidad);
    }, 0);
  };

  const calcularTotalPagos = () => {
    return pagoFields.reduce((total, field, idx) => {
      const monto = parseFloat(String(watch(`pagos.${idx}.monto`) || 0));
      return total + monto;
    }, 0);
  };

  const onSubmit = async (data: CobroForm) => {
    console.log("submit start", data);
    setFormLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const monto_total = data.conceptos.reduce((total, concepto) => {
        const precio = parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0));
        const cantidad = parseInt(String(concepto.cantidad ?? 1));
        return total + (precio * cantidad);
      }, 0);
      if (data.pagos && calcularTotalPagos() !== monto_total) {
        setErrorMsg("La suma de los métodos de pago debe ser igual al total del cobro");
        setFormLoading(false);
        console.log("submit error: suma de métodos de pago no coincide");
        return;
      }
      const payload = {
        paciente_id: selectedPaciente?.id || data.paciente,
        usuario_id: data.usuario,
        fecha_cobro: data.fecha,
        monto_total,
        estado: estadoCobro,
        notas: data.pidioFactura ? 'Pidió factura' : '',
        pagos: data.pagos.map(pago => ({
          metodo: pago.metodo,
          monto: parseFloat(String(pago.monto))
        }))
      };
      console.log("payload a enviar", payload);
      const cobro = await createCobro(payload);
      for (const concepto of data.conceptos) {
        console.log("agregando concepto", concepto);
        await agregarConceptoACobro({
          cobro_id: cobro.id,
          servicio_id: concepto.conceptoId,
          precio_unitario: parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0)),
          cantidad: parseInt(String(concepto.cantidad ?? 1)),
          subtotal: (parseFloat(String(concepto.precio_unitario ?? servicios.find(s => s.id === concepto.conceptoId)?.precio_base ?? 0)) * parseInt(String(concepto.cantidad ?? 1))),
          consultorio_id: data.consultorio,
        });
      }
      
      // 🎯 FLUJO AUTOMÁTICO DE FACTURACIÓN
      if (data.pidioFactura) {
        try {
          console.log("🔄 Generando factura automáticamente para cobro:", cobro.id);
          
          const folio = `${Date.now()}`;
          
          // Calcular el total correcto incluyendo impuestos
          const totalConImpuestos = data.conceptos.reduce((total, concepto: any) => {
            const subtotal = parseFloat(String(concepto.precio_unitario)) * parseInt(String(concepto.cantidad));
            const impuestos = subtotal * 0.16; // 16% IVA
            return total + subtotal + impuestos;
          }, 0);
          
          const ticketData = {
            "Fecha": new Date().toLocaleString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '').replace('p.m.', '').replace('a.m.', '').trim(),
            "MontoTicket": totalConImpuestos,
            "NumTicket": folio,
            "ClaveTienda": "E0005",
            "Conceptos": data.conceptos.map((concepto: any) => {
              const servicio = servicios.find(s => s.id === concepto.conceptoId);
              const subtotal = parseFloat(String(concepto.precio_unitario)) * parseInt(String(concepto.cantidad));
              return {
                "ClaveSat": servicio?.clave_sat || "90101501",
                "Descripcion": servicio?.nombre || "Servicio Médico",
                "Monto": subtotal,
                "ClaveUnidad": servicio?.clave_unidad || "E48",
                "Cantidad": parseInt(String(concepto.cantidad)),
                "PrecioUnitario": parseFloat(String(concepto.precio_unitario)),
                "Importe": subtotal,
                "ImpuestosRetenidos": [],
                "ImpuestosTrasladados": [
                  {
                    "BaseImpuesto": subtotal,
                    "Impuesto": "002",
                    "TipoFactor": "Tasa",
                    "TasaOCuota": 0.16,
                    "Importe": subtotal * 0.16
                  }
                ]
              };
            })
          };
          
          const result = await facturacionService.createTicketWithValidation(ticketData);
          
          if (result.success) {
            setSuccessMsg(`✅ Cobro registrado y factura generada exitosamente\nFolio: ${folio}`);
            console.log("✅ Factura generada automáticamente - Folio:", folio);
          } else {
            setSuccessMsg(`✅ Cobro registrado correctamente\n⚠️ Error al generar factura automática: ${result.message}`);
            console.log("⚠️ Error generando factura automática:", result.message);
          }
        } catch (error) {
          console.error('❌ Error en facturación automática:', error);
          setSuccessMsg("✅ Cobro registrado correctamente\n⚠️ Error al generar factura automática");
        }
      } else {
        setSuccessMsg("Cobro registrado correctamente");
      }
      
      setShowForm(false);
      console.log("submit success");
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || e?.message || "Error al registrar el cobro");
      console.log("submit error", e);
    } finally {
      setFormLoading(false);
    }
  };

  console.log("Form render", { errors, fields, pagoFields, selectedPaciente, pacienteValue: watch("paciente") });

  return (
    <div className={embedded ? "" : "w-full max-w-[1600px] pt-10"}>
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-extrabold text-[#4285f2]">Gestión de Cobros</h1>
        <Button
          className="bg-[#4285f2] text-white h-14 px-10 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-2xl font-bold"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancelar" : "Nuevo Cobro"}
        </Button>
      </div>
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl p-10 mb-12 max-w-4xl mx-auto flex flex-col gap-8 border border-gray-200 animate-fade-in"
          aria-label="Formulario de registro de cobro"
        >
          <h2 className="text-3xl font-bold text-[#4285f2] mb-4">Registrar Nuevo Cobro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="paciente" className="block text-xl font-semibold mb-2 text-gray-900">Paciente *</label>
              <PacienteSearch
                pacientes={pacientes}
                onPacienteSelect={(paciente) => {
                  setSelectedPaciente(paciente)
                  setValue("paciente", paciente.id)
                  // Si el paciente no está en la lista, agregarlo (por si es nuevo)
                  if (paciente && !pacientes.some(p => p.id === paciente.id)) {
                    setPacientes(prev => [...prev, paciente])
                  }
                }}
                placeholder="Buscar paciente por nombre..."
              />
              <input id="paciente" type="hidden" {...register("paciente")}/>
              {errors.paciente && (
                <span className="text-red-500 text-lg block mt-1" role="alert">{errors.paciente.message as string}</span>
              )}
            </div>
            <div>
              <label htmlFor="usuario" className="block text-xl font-semibold mb-2 text-gray-900">Usuario *</label>
              {userLoading ? (
                <div className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg bg-gray-50 flex items-center text-gray-500">
                  Cargando usuario...
                </div>
              ) : currentUser ? (
                <div className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg bg-gray-50 flex items-center text-gray-700">
                  {currentUser.nombre} {currentUser.apellido} ({currentUser.rol})
                </div>
              ) : (
                <select
                  id="usuario"
                  {...register("usuario")}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  defaultValue=""
                  aria-required="true"
                >
                  <option value="" disabled>Selecciona un usuario</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                  ))}
                </select>
              )}
              <input type="hidden" {...register("usuario")} value={currentUser?.id || ""} />
              {errors.usuario && <span className="text-red-500 text-lg block mt-1" role="alert">{errors.usuario.message as string}</span>}
            </div>
            <div>
              <label htmlFor="consultorio" className="block text-xl font-semibold mb-2 text-gray-900">Consultorio *</label>
              {userLoading ? (
                <div className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg bg-gray-50 flex items-center text-gray-500">
                  Cargando consultorio...
                </div>
              ) : currentUser && currentUser.rol === 'DOCTOR' ? (
                // Los doctores pueden elegir consultorio
                <select
                  id="consultorio"
                  {...register("consultorio")}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  defaultValue=""
                  aria-required="true"
                >
                  <option value="" disabled>Selecciona un consultorio</option>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              ) : currentUser && currentUser.consultorio_id ? (
                // Secretarias y enfermeras tienen consultorio fijo
                <div className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg bg-gray-50 flex items-center text-gray-700">
                  {consultorios.find(c => c.id === currentUser.consultorio_id)?.nombre || 'Consultorio no encontrado'}
                </div>
              ) : (
                // Fallback para otros casos
                <select
                  id="consultorio"
                  {...register("consultorio")}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  defaultValue=""
                  aria-required="true"
                >
                  <option value="" disabled>Selecciona un consultorio</option>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              )}
              {currentUser && currentUser.rol !== 'DOCTOR' && (
                <input type="hidden" {...register("consultorio")} value={currentUser?.consultorio_id || ""} />
              )}
              {errors.consultorio && <span className="text-red-500 text-lg block mt-1" role="alert">{errors.consultorio.message as string}</span>}
            </div>
            <div>
              <label htmlFor="fecha" className="block text-xl font-semibold mb-2 text-gray-900">Fecha *</label>
              <Input
                id="fecha"
                type="date"
                {...register("fecha")}
                value={getToday()}
                readOnly
                className="bg-gray-50 cursor-not-allowed h-14 px-4 text-xl text-gray-900"
                aria-required="true"
              />
              {errors.fecha && <span className="text-red-500 text-lg block mt-1" role="alert">{errors.fecha.message as string}</span>}
            </div>
          </div>
          <div>
            <label className="block text-xl font-semibold mb-3 text-gray-900">Conceptos de Cobro</label>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end mb-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Concepto</label>
                  <ConceptoSearch
                    conceptos={servicios}
                    value={field.conceptoId}
                    onChange={concepto => {
                      if (concepto) {
                        update(idx, {
                          conceptoId: concepto.id,
                          precio_unitario: concepto.precio_base.toString(),
                          cantidad: field.cantidad ?? "1"
                        });
                      } else {
                        update(idx, {
                          conceptoId: "",
                          precio_unitario: "0",
                          cantidad: field.cantidad ?? "1"
                        });
                      }
                    }}
                    placeholder="Buscar concepto por nombre..."
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Precio unitario</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    {...register(`conceptos.${idx}.precio_unitario` as const)}
                    className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Precio"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Unidades</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    {...register(`conceptos.${idx}.cantidad` as const)}
                    className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Cant."
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-base font-medium text-gray-700 mb-1 ml-1">Subtotal</label>
                  <span className="w-full h-14 flex items-center text-xl font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4">${calcularSubtotal({
                    precio_unitario: watch(`conceptos.${idx}.precio_unitario`) || servicios.find(s => s.id === field.conceptoId)?.precio_base || 0,
                    cantidad: watch(`conceptos.${idx}.cantidad`) || 1,
                  }).toFixed(2)}</span>
                </div>
                <div className="flex items-end h-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-14 px-6 text-xl font-semibold"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                  >
                    Quitar
                  </Button>
                </div>
                {errors.conceptos?.[idx]?.conceptoId && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].conceptoId.message as string}</span>}
                {errors.conceptos?.[idx]?.precio_unitario && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].precio_unitario.message as string}</span>}
                {errors.conceptos?.[idx]?.cantidad && <span className="text-red-500 text-lg block mt-1 col-span-5">{errors.conceptos[idx].cantidad.message as string}</span>}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-14 px-8 text-xl font-semibold mt-2"
              onClick={() => append({ conceptoId: "", precio_unitario: "0", cantidad: "1" })}
            >
              + Agregar Concepto
            </Button>
            {errors.conceptos && typeof errors.conceptos.message === 'string' && <span className="text-red-500 text-lg block mt-2">{errors.conceptos.message}</span>}
            <div className="flex justify-end mt-4">
              <span className="text-2xl font-bold text-gray-900">Total: ${calcularTotal().toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-8">
            <label className="block text-xl font-semibold mb-3 text-gray-900">Métodos de Pago *</label>
            {pagoFields.map((field, idx) => (
              <div key={field.id} className="flex gap-4 items-end mb-2">
                <select
                  {...register(`pagos.${idx}.metodo` as const)}
                  className="w-60 h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  defaultValue={field.metodo || ""}
                >
                  <option value="" disabled>Selecciona un método</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTRO">Otro</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register(`pagos.${idx}.monto` as const)}
                  className="w-40 h-14 px-4 text-xl border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Monto"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 px-6 text-xl font-semibold"
                  onClick={() => removePago(idx)}
                  disabled={pagoFields.length === 1}
                >
                  Quitar
                </Button>
                {errors.pagos?.[idx]?.metodo && <span className="text-red-500 text-lg block mt-1">{errors.pagos[idx].metodo.message as string}</span>}
                {errors.pagos?.[idx]?.monto && <span className="text-red-500 text-lg block mt-1">{errors.pagos[idx].monto.message as string}</span>}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-14 px-8 text-xl font-semibold mt-2"
              onClick={() => appendPago({ metodo: "", monto: "" })}
            >
              + Agregar método
            </Button>
            <div className="flex justify-end mt-2">
              <span className="text-lg font-bold text-gray-900">Total métodos: ${calcularTotalPagos().toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 mt-8">
              <input type="checkbox" {...register("pidioFactura")} className="w-6 h-6" />
              <label className="text-xl font-semibold text-gray-900">¿Pidió factura?</label>
            </div>
          </div>
          <div className="mt-8">
            <label className="block text-xl font-semibold mb-3 text-gray-900">Estado del Cobro *</label>
            <select
              value={estadoCobro}
              onChange={e => setEstadoCobro(e.target.value)}
              className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          <div className="flex justify-end gap-6 mt-8">
            <Button
              type="button"
              variant="outline"
              className="h-14 px-10 text-2xl font-bold"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#4285f2] text-white h-14 px-10 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-2xl font-bold flex items-center gap-2"
              disabled={formLoading}
              aria-busy={formLoading}
            >
              {formLoading && (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              )}
              {formLoading ? "Guardando..." : "Guardar Cobro"}
            </Button>
          </div>
          {errorMsg && (
            <div className="text-red-600 text-xl mt-4 font-bold">{errorMsg === "La suma de los métodos de pago debe ser igual al total del cobro" ? `La suma de los métodos de pago ($${calcularTotalPagos().toFixed(2)}) debe ser igual al total del cobro ($${calcularTotal().toFixed(2)})` : errorMsg}</div>
          )}
        </form>
      )}


      {/* Filtros de estado */}
      <div className="flex items-center justify-between mt-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Cobros ({cobrosFiltradosPorEstado.length} registros)
        </h3>
        <div className="flex gap-2">
          <Button
            id="btn-pendientes"
            variant={filtroEstado === 'pendientes' ? 'default' : 'outline'}
            onClick={() => setFiltroEstado('pendientes')}
            className="text-sm"
          >
            Pendientes ({cobrosPendientes.length})
          </Button>
          <Button
            variant={filtroEstado === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltroEstado('todos')}
            className="text-sm"
          >
            Todos
          </Button>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
          📄 PDF
        </Button>
        <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
          📊 Excel
        </Button>
      </div>
      
      {/* Búsqueda de pacientes - MOVIDA AQUÍ */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Buscar paciente</label>
            <PacienteSearch
              pacientes={pacientes}
              onPacienteSelect={(paciente) => {
                handleFiltersChange({ pacienteId: paciente.id });
              }}
              placeholder="Buscar paciente por nombre..."
            />
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => handleFiltersChange({})}
              className="h-10"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto mt-12">
        <table className="min-w-full border text-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Paciente</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Conceptos</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Monto</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Fecha</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Estado</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Método</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Factura</th>
              <th className="px-8 py-5 text-left text-gray-700 uppercase tracking-wider text-lg">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cobrosFiltradosPorEstado.map((cobro) => (
              <tr key={cobro.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.paciente?.nombre} {cobro.paciente?.apellido}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.conceptos && cobro.conceptos.length > 0
                    ? cobro.conceptos.map((con: any) => `${con.cantidad} ${con.servicio?.nombre || ''}`).join(', ')
                    : '-'}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm font-semibold text-green-600">
                  ${cobro.monto_total}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900">
                  {cobro.fecha_cobro?.slice(0,10)}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {cobro.estado === 'PENDIENTE' ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      ⏳ Pendiente
                    </span>
                  ) : cobro.estado === 'COMPLETADO' ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ Completado
                    </span>
                  ) : cobro.estado === 'CANCELADO' ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      ❌ Cancelado
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      - Sin estado
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {Array.isArray(cobro.metodos_pago) && cobro.metodos_pago.length > 0 ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[#e3f0fd] text-[#4285f2]">
                      {cobro.metodos_pago.map((mp: any) => mp.metodo_pago).join(', ')}
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-400">-</span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap">
                  {cobro.notas?.toLowerCase().includes("factura") ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap flex gap-2">
                  {cobro.estado === 'PENDIENTE' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-green-500 text-white hover:bg-green-600"
                      onClick={async () => {
                        if (window.confirm('¿Marcar este cobro como completado?')) {
                          try {
                            await editarCobro(cobro.id, { ...cobro, estado: 'COMPLETADO' });
                            await refreshCobros();
                          } catch (e) {
                            alert('Error al completar el cobro');
                          }
                        }
                      }}
                    >
                      Completar
                    </Button>
                  )}
                  {cobro.notas?.toLowerCase().includes("factura") && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-blue-500 text-white hover:bg-blue-600"
                      onClick={async () => {
                        try {
                          // Generar ticket en NimbusLabs
                          const folio = `${Date.now()}`;
                          
                          // Calcular el total correcto incluyendo impuestos
                          const totalConImpuestos = cobro.conceptos?.reduce((total: number, concepto: any) => {
                            const subtotal = concepto.subtotal || concepto.precio_unitario * concepto.cantidad;
                            const impuestos = subtotal * 0.16; // 16% IVA
                            return total + subtotal + impuestos;
                          }, 0) || 0;
                          
                          const ticketData = {
                            "Fecha": new Date().toLocaleString('es-MX', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).replace(',', '').replace('p.m.', '').replace('a.m.', '').trim(),
                            "MontoTicket": totalConImpuestos,
                            "NumTicket": folio,
                            "ClaveTienda": "E0005",
                            // ✅ NUEVO: Datos del paciente para envío de email
                            "pacienteNombre": cobro.paciente_nombre + ' ' + cobro.paciente_apellido,
                            "pacienteEmail": cobro.paciente_email,
                            "pacienteId": cobro.paciente_id,
                            "cobroId": cobro.id,
                            "Conceptos": cobro.conceptos?.map((concepto: any) => ({
                              "ClaveSat": concepto.servicio?.clave_sat || "90101501",
                              "Descripcion": concepto.servicio?.nombre || "Servicio Médico",
                              "Monto": concepto.subtotal || concepto.precio_unitario * concepto.cantidad,
                              "ClaveUnidad": concepto.servicio?.clave_unidad || "E48",
                              "Cantidad": concepto.cantidad || 1,
                              "PrecioUnitario": concepto.precio_unitario || 0,
                              "Importe": concepto.subtotal || concepto.precio_unitario * concepto.cantidad,
                              "ImpuestosRetenidos": [],
                              "ImpuestosTrasladados": [
                                {
                                  "BaseImpuesto": concepto.subtotal || concepto.precio_unitario * concepto.cantidad,
                                  "Impuesto": "002",
                                  "TipoFactor": "Tasa",
                                  "TasaOCuota": 0.16,
                                  "Importe": (concepto.subtotal || concepto.precio_unitario * concepto.cantidad) * 0.16
                                }
                              ]
                            })) || []
                          };

                          const result = await facturacionService.createTicketWithValidation(ticketData);
                          
                          if (result.success) {
                            alert(`✅ Factura generada exitosamente\nFolio: ${folio}\nPortal: https://testcfdi.nimbuslabs.mx/Autofactura/autofactura/IndexTicket`);
                          } else {
                            alert(`❌ Error al generar factura: ${result.message}`);
                          }
                        } catch (error) {
                          console.error('Error generando factura:', error);
                          alert('Error al generar la factura');
                        }
                      }}
                    >
                      Generar Factura
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditCobro(cobro);
                    setEditFormOpen(true);
                  }}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    if (window.confirm('¿Seguro que deseas eliminar este cobro?')) {
                      try {
                        await eliminarCobro(cobro.id);
                        await refreshCobros();
                      } catch (e) {
                        alert('Error al eliminar el cobro');
                      }
                    }
                  }}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cobrosFiltradosPorEstado.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-2">📅</div>
            <p className="text-gray-600 text-lg font-medium">
              No se encontraron cobros en el rango de fechas seleccionado
            </p>
            <p className="text-gray-500 text-base mt-1">
              Intenta cambiar las fechas o agregar un nuevo cobro
            </p>
          </div>
        )}
      </div>
      {successMsg && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-8 py-5 rounded-xl shadow-2xl text-2xl font-bold animate-in slide-in-from-right-2 duration-500">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300">
          ❌ {errorMsg}
        </div>
      )}
      {editFormOpen && editCobro && (
        <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cobro</DialogTitle>
              <DialogDescription>
                Modifica los datos del cobro seleccionado
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Recoge los datos del formulario (puedes usar un ref o un pequeño formulario controlado)
                // Aquí solo un ejemplo básico:
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const payload: any = {};
                formData.forEach((value, key) => { payload[key] = value; });
                try {
                  await editarCobro(editCobro.id, payload);
                  setEditFormOpen(false);
                  setEditCobro(null);
                  await refreshCobros();
                } catch (err) {
                  alert('Error al editar el cobro');
                }
              }}
              className="flex flex-col gap-4"
            >
              <label>Monto
                <input name="monto_total" defaultValue={editCobro.monto_total} className="border p-2 rounded w-full" />
              </label>
              <label>Notas
                <input name="notas" defaultValue={editCobro.notas} className="border p-2 rounded w-full" />
              </label>
              {/* Agrega más campos según lo que quieras permitir editar */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditFormOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 