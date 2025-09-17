import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Search, Download, Filter, User, Activity } from "lucide-react";
import { getHistorialGeneral, getHistorialInventario, getHistorialCalendario, getHistorialUsuarios, getHistorialEstadisticas, buscarHistorial as buscarHistorialService, exportarHistorial as exportarHistorialService } from "../services/historialService";
import { usePermisos } from '../hooks/usePermisos';

interface HistorialItem {
  id: string;
  created_at: string;
  tipo_cambio: 'CREACION' | 'EDICION' | 'ELIMINACION' | 'ACTUALIZACION' | 'ENTRADA' | 'SALIDA';
  accion?: string;
  modulo?: string;
  tipo?: string;
  descripcion?: string;
  detalles?: {
    cobro_id?: string;
    producto_id?: string;
    producto_nombre?: string;
    cantidad?: string;
    tipo?: string;
    paciente_id?: string;
    paciente_nombre?: string;
    fecha_cita?: string;
    usuario_id?: string;
    email?: string;
    rol?: string;
  };
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email?: string;
    rol?: string;
  };
  cobro?: {
    id: string;
    paciente: {
      nombre: string;
      apellido: string;
    };
  };
  detalles_antes?: any;
  detalles_despues: any;
}

interface Estadisticas {
  totalRegistros: number;
  cambiosPorTipo: Array<{
    tipo_cambio: string;
    _count: { tipo_cambio: number };
  }>;
  cambiosPorUsuario: Array<{
    usuario_id: string;
    _count: { usuario_id: number };
  }>;
}

export default function Historial() {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuariosExpandidos, setUsuariosExpandidos] = useState<Set<string>>(new Set());
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    usuarioId: '',
    tipoCambio: '',
    busqueda: '',
    modulo: 'cobros' // Nuevo filtro de módulo
  });

  // Verificar permisos
  const { permisos, loading: permisosLoading } = usePermisos();

  // Verificar si el usuario puede ver el historial
  useEffect(() => {
    if (!permisosLoading && permisos && !permisos.puede_ver_historial) {
      setLoading(false);
      return;
    }
  }, [permisos, permisosLoading]);

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fecha = `${year}-${month}-${day}`;
    console.log('🔍 DEBUG - getToday() - fecha actual:', fecha, 'Date object:', today);
    return fecha;
  };

  // Función para obtener la fecha de hace X días
  const getDateFromDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener la fecha de hace X meses
  const getDateFromMonthsAgo = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener la fecha de hace X años
  const getDateFromYearsAgo = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Funciones para aplicar filtros de tiempo
  const aplicarFiltroHoy = () => {
    const hoy = getToday();
    console.log('🔍 DEBUG - aplicarFiltroHoy - fecha actual:', hoy);
    setFiltros(prev => ({ ...prev, fechaDesde: hoy, fechaHasta: hoy }));
  };

  const aplicarFiltroSemana = () => {
    const hoy = getToday();
    const hace7Dias = getDateFromDaysAgo(7);
    setFiltros(prev => ({ ...prev, fechaDesde: hace7Dias, fechaHasta: hoy }));
  };

  const aplicarFiltroMes = () => {
    const hoy = getToday();
    const hace1Mes = getDateFromMonthsAgo(1);
    setFiltros(prev => ({ ...prev, fechaDesde: hace1Mes, fechaHasta: hoy }));
  };

  const aplicarFiltroAno = () => {
    const hoy = getToday();
    const hace1Ano = getDateFromYearsAgo(1);
    setFiltros(prev => ({ ...prev, fechaDesde: hace1Ano, fechaHasta: hoy }));
  };

  const limpiarFiltrosFecha = () => {
    setFiltros(prev => ({ ...prev, fechaDesde: '', fechaHasta: '' }));
  };
  const [vista, setVista] = useState<'historial' | 'estadisticas'>('historial');

  useEffect(() => {
    cargarHistorial();
    cargarEstadisticas();
  }, []);

  // Efecto para aplicar filtros automáticamente cuando cambien
  useEffect(() => {
    if (filtros.fechaDesde || filtros.fechaHasta || filtros.tipoCambio || filtros.busqueda || filtros.modulo) {
      cargarHistorial();
    }
  }, [filtros.fechaDesde, filtros.fechaHasta, filtros.tipoCambio, filtros.modulo]);

  const cargarHistorial = async () => {
    try {
      console.log('🔍 DEBUG - cargarHistorial iniciado - módulo:', filtros.modulo);
      setLoading(true);
      setError(null);
      
      let data;
      switch (filtros.modulo) {
        case 'inventario':
          data = await getHistorialInventario({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            usuarioId: filtros.usuarioId,
            tipoCambio: filtros.tipoCambio
          });
          break;
        case 'calendario':
          data = await getHistorialCalendario({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            usuarioId: filtros.usuarioId,
            tipoCambio: filtros.tipoCambio
          });
          break;
        case 'usuarios':
          data = await getHistorialUsuarios({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            usuarioId: filtros.usuarioId,
            tipoCambio: filtros.tipoCambio
          });
          break;
        default: // cobros
          data = await getHistorialGeneral({
            fechaDesde: filtros.fechaDesde,
            fechaHasta: filtros.fechaHasta,
            usuarioId: filtros.usuarioId,
            tipoCambio: filtros.tipoCambio,
            modulo: filtros.modulo
          });
          break;
      }
      
      console.log('🔍 DEBUG - Datos recibidos del backend:', data);
      console.log('🔍 DEBUG - Cantidad de registros:', data.length);
      

      
      setHistorial(data);
      console.log('🔍 DEBUG - Estado historial actualizado');
    } catch (error: any) {
      console.error('❌ Error cargando historial:', error);
      setError(error.message || 'Error desconocido al cargar el historial');
      if (error.message.includes('Sesión expirada')) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
      console.log('🔍 DEBUG - Loading terminado');
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const data = await getHistorialEstadisticas();
      setEstadisticas(data);
    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
      if (error.message.includes('Sesión expirada')) {
        window.location.href = '/';
      }
    }
  };

  const buscarHistorial = async () => {
    if (!filtros.busqueda.trim()) {
      cargarHistorial();
      return;
    }

    try {
      setLoading(true);
      const data = await buscarHistorialService(filtros.busqueda);
      setHistorial(data);
    } catch (error: any) {
      console.error('Error buscando historial:', error);
      if (error.message.includes('Sesión expirada')) {
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const exportarHistorial = async (formato: 'json' | 'csv') => {
    try {
      const response = await exportarHistorialService(formato, {
        fechaDesde: filtros.fechaDesde,
        fechaHasta: filtros.fechaHasta,
        usuarioId: filtros.usuarioId,
        tipoCambio: filtros.tipoCambio
      });
      
      if (formato === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error exportando historial:', error);
      if (error.message.includes('Sesión expirada')) {
        window.location.href = '/';
      }
    }
  };

  const getTipoCambioColor = (tipo: string) => {
    switch (tipo) {
      case 'CREACION': return 'bg-green-100 text-green-800';
      case 'EDICION': return 'bg-blue-100 text-blue-800';
      case 'ELIMINACION': return 'bg-red-100 text-red-800';
      case 'ACTUALIZACION': return 'bg-yellow-100 text-yellow-800';
      case 'ENTRADA': return 'bg-emerald-100 text-emerald-800';
      case 'SALIDA': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoCambioIcon = (tipo: string) => {
    switch (tipo) {
      case 'CREACION': return '➕';
      case 'EDICION': return '✏️';
      case 'ELIMINACION': return '🗑️';
      case 'ACTUALIZACION': return '🔄';
      case 'ENTRADA': return '📥';
      case 'SALIDA': return '📤';
      default: return '📝';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatearFechaRelativa = (fecha: string) => {
    const ahora = new Date();
    const fechaEvento = new Date(fecha);
    const diferencia = ahora.getTime() - fechaEvento.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return formatearFecha(fecha);
  };

  const getDescripcionAccion = (tipo: string, detalles: any, modulo?: string) => {
    // Extraer metadata si está disponible
    let metadata = null;
    try {
      if (detalles && typeof detalles === 'string') {
        const parsed = JSON.parse(detalles);
        metadata = parsed.metadata || null;
      } else if (detalles && detalles.metadata) {
        metadata = detalles.metadata;
      }
    } catch (error) {
      console.log('Error parsing metadata:', error);
    }

    // Descripciones específicas por módulo
    switch (modulo) {
      case 'calendario':
        switch (tipo) {
          case 'CREACION':
            return 'creó una nueva cita';
          case 'EDICION':
            return 'editó una cita existente';
          case 'ELIMINACION':
            return 'canceló una cita';
          case 'ACTUALIZACION':
            return 'actualizó el estado de una cita';
          default:
            return 'realizó una acción en el calendario';
        }
      
      case 'inventario':
        switch (tipo) {
          case 'ENTRADA':
            return 'registró una entrada de inventario';
          case 'SALIDA':
            return 'registró una salida de inventario';
          case 'CREACION':
            const tipoMovimiento = metadata?.tipo_movimiento || 'movimiento';
            return tipoMovimiento === 'ENTRADA' ? 'registró una entrada de inventario' : 'registró una salida de inventario';
          case 'EDICION':
            return 'editó un movimiento de inventario';
          case 'ELIMINACION':
            return 'eliminó un movimiento de inventario';
          case 'ACTUALIZACION':
            return 'actualizó un movimiento de inventario';
          default:
            return 'realizó una acción en el inventario';
        }
      
      case 'usuarios':
        switch (tipo) {
          case 'CREACION':
            return 'creó un nuevo usuario';
          case 'EDICION':
            return 'editó un usuario existente';
          case 'ELIMINACION':
            return 'eliminó un usuario';
          case 'ACTUALIZACION':
            return 'actualizó permisos de usuario';
          default:
            return 'realizó una acción en usuarios';
        }
      
      case 'cobros':
      default:
        switch (tipo) {
          case 'CREACION':
            return 'creó un nuevo cobro';
          case 'EDICION':
            return 'editó un cobro existente';
          case 'ELIMINACION':
            return 'eliminó un cobro';
          case 'ACTUALIZACION':
            return 'actualizó el estado de un cobro';
          default:
            return 'realizó una acción';
        }
    }
  };

  const getDetallesResumidos = (detalles: any, modulo?: string) => {
    if (!detalles) return null;
    
    try {
      const detalle = typeof detalles === 'string' ? JSON.parse(detalles) : detalles;
      const metadata = detalle.metadata || {};
      
      // Detalles específicos por módulo
      switch (modulo) {
        case 'calendario':
          const resumenCalendario = [];
          if (metadata.paciente_nombre) resumenCalendario.push(`Paciente: ${metadata.paciente_nombre}`);
          if (metadata.consultorio_nombre) resumenCalendario.push(`Consultorio: ${metadata.consultorio_nombre}`);
          if (metadata.cita_fecha) {
            const fecha = new Date(metadata.cita_fecha);
            resumenCalendario.push(`Fecha: ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
          }
          if (metadata.estado_nuevo) resumenCalendario.push(`Estado: ${metadata.estado_nuevo}`);
          if (metadata.motivo_cambio) resumenCalendario.push(`Motivo: ${metadata.motivo_cambio}`);
          return resumenCalendario.length > 0 ? resumenCalendario.join(' • ') : 'Información de la cita';
        
        case 'inventario':
          const resumenInventario = [];
          if (metadata.producto_nombre) resumenInventario.push(`Producto: ${metadata.producto_nombre}`);
          if (metadata.cantidad) resumenInventario.push(`Cantidad: ${metadata.cantidad}`);
          if (metadata.tipo_movimiento) resumenInventario.push(`Tipo: ${metadata.tipo_movimiento}`);
          if (metadata.consultorio_nombre) resumenInventario.push(`Consultorio: ${metadata.consultorio_nombre}`);
          if (metadata.paciente_nombre) resumenInventario.push(`Paciente: ${metadata.paciente_nombre}`);
          if (metadata.motivo_cambio) resumenInventario.push(`Motivo: ${metadata.motivo_cambio}`);
          return resumenInventario.length > 0 ? resumenInventario.join(' • ') : 'Información del movimiento';
        
        case 'usuarios':
          const resumenUsuarios = [];
          if (metadata.usuario_nombre) resumenUsuarios.push(`Usuario: ${metadata.usuario_nombre}`);
          if (metadata.usuario_rol) resumenUsuarios.push(`Rol: ${metadata.usuario_rol}`);
          if (metadata.permisos_cambiados) resumenUsuarios.push(`Permisos: ${metadata.permisos_cambiados.join(', ')}`);
          if (metadata.estado_anterior && metadata.estado_nuevo) {
            resumenUsuarios.push(`${metadata.estado_anterior} → ${metadata.estado_nuevo}`);
          }
          if (metadata.motivo_cambio) resumenUsuarios.push(`Motivo: ${metadata.motivo_cambio}`);
          return resumenUsuarios.length > 0 ? resumenUsuarios.join(' • ') : 'Información del usuario';
        
        case 'cobros':
        default:
          // Extraer información relevante del cobro
          const resumen = [];
          if (detalle.monto) resumen.push(`$${detalle.monto}`);
          if (detalle.concepto) resumen.push(detalle.concepto);
          if (detalle.estado) resumen.push(`Estado: ${detalle.estado}`);
          if (detalle.metodo_pago) resumen.push(`Pago: ${detalle.metodo_pago}`);
          return resumen.length > 0 ? resumen.join(' • ') : null;
      }
    } catch (error) {
      console.log('Error parsing detalles:', error);
      return null;
    }
  };

  const toggleUsuarioExpandido = (usuarioId: string) => {
    setUsuariosExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(usuarioId)) {
        nuevo.delete(usuarioId);
      } else {
        nuevo.add(usuarioId);
      }
      return nuevo;
    });
  };

  console.log('🔍 DEBUG - Render del componente Historial - loading:', loading, 'historial.length:', historial.length);
  

  
  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Verificar permisos */}
      {permisosLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando permisos...</p>
          </div>
        </div>
      ) : !permisos?.puede_ver_historial ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">No tienes permisos para ver el historial de cambios.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filtros.modulo === 'inventario' ? '📦 Historial de Inventario' : 
                 filtros.modulo === 'calendario' ? '📅 Historial de Calendario' : 
                 filtros.modulo === 'usuarios' ? '👥 Historial de Usuarios' : 
                 '💰 Historial de Cobros'}
              </h1>
              <p className="text-gray-600 mt-2">
                {filtros.modulo === 'inventario' ? 'Registro de cambios en inventario y movimientos' : 
                 filtros.modulo === 'calendario' ? 'Registro de cambios en citas y disponibilidad' : 
                 filtros.modulo === 'usuarios' ? 'Registro de cambios en usuarios y permisos' : 
                 'Registro completo de todas las modificaciones en cobros'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={vista === 'historial' ? 'default' : 'outline'}
                onClick={() => setVista('historial')}
              >
                <Activity className="w-4 h-4 mr-2" />
                Historial
              </Button>
              <Button
                variant={vista === 'estadisticas' ? 'default' : 'outline'}
                onClick={() => setVista('estadisticas')}
              >
                <User className="w-4 h-4 mr-2" />
                Estadísticas
              </Button>
            </div>
          </div>

             {/* Filtros */}
       <Card className="mb-6">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Filter className="w-5 h-5" />
             Filtros
           </CardTitle>
         </CardHeader>
         <CardContent>
           {/* Filtros rápidos de tiempo */}
           <div className="mb-6">
             <label className="block text-sm font-medium text-gray-700 mb-3">Filtros Rápidos</label>
             <div className="flex flex-wrap gap-2">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={aplicarFiltroHoy}
                 className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
               >
                 Hoy
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={aplicarFiltroSemana}
                 className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
               >
                 Última Semana
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={aplicarFiltroMes}
                 className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
               >
                 Último Mes
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={aplicarFiltroAno}
                 className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
               >
                 Último Año
               </Button>
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={limpiarFiltrosFecha}
                 className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
               >
                 Limpiar Fechas
               </Button>
             </div>
           </div>

           {/* Filtros específicos */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
               <select
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={filtros.modulo}
                 onChange={(e) => setFiltros(prev => ({ ...prev, modulo: e.target.value }))}
               >
                 <option value="cobros">💰 Cobros</option>
                 <option value="inventario">📦 Inventario</option>
                 <option value="calendario">📅 Calendario</option>
                 <option value="usuarios">👥 Usuarios</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
               <Input
                 type="date"
                 value={filtros.fechaDesde}
                 onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
               <Input
                 type="date"
                 value={filtros.fechaHasta}
                 onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cambio</label>
               <select
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={filtros.tipoCambio}
                 onChange={(e) => setFiltros(prev => ({ ...prev, tipoCambio: e.target.value }))}
               >
                 <option value="">Todos</option>
                 <option value="CREACION">Creación</option>
                 <option value="EDICION">Edición</option>
                 <option value="ELIMINACION">Eliminación</option>
                 <option value="ACTUALIZACION">Actualización</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
               <div className="flex gap-2">
                 <Input
                   placeholder="Buscar por usuario, paciente..."
                   value={filtros.busqueda}
                   onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                   onKeyPress={(e) => e.key === 'Enter' && buscarHistorial()}
                 />
                 <Button onClick={buscarHistorial} size="sm">
                   <Search className="w-4 h-4" />
                 </Button>
               </div>
             </div>
           </div>
           
                       {/* Indicadores de filtros activos */}
            {(filtros.modulo !== 'cobros' || filtros.fechaDesde || filtros.fechaHasta || filtros.tipoCambio || filtros.busqueda) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Filtros Activos:</h4>
                <div className="flex flex-wrap gap-2">
                  {filtros.modulo !== 'cobros' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {filtros.modulo === 'inventario' ? '📦 Inventario' : 
                       filtros.modulo === 'calendario' ? '📅 Calendario' : 
                       filtros.modulo === 'usuarios' ? '👥 Usuarios' : '💰 Cobros'}
                    </Badge>
                  )}
                  {filtros.fechaDesde && filtros.fechaHasta && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      📅 {filtros.fechaDesde} - {filtros.fechaHasta}
                    </Badge>
                  )}
                  {filtros.tipoCambio && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      🔄 {filtros.tipoCambio}
                    </Badge>
                  )}
                  {filtros.busqueda && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      🔍 "{filtros.busqueda}"
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={cargarHistorial}>
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={() => setFiltros({
                fechaDesde: '',
                fechaHasta: '',
                usuarioId: '',
                tipoCambio: '',
                busqueda: '',
                modulo: filtros.modulo
              })} className="text-white">
                Limpiar Todo
              </Button>
              <Button variant="outline" onClick={() => exportarHistorial('csv')} className="text-white">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => exportarHistorial('json')} className="text-white">
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
         </CardContent>
       </Card>

             {vista === 'historial' ? (
         /* Vista de Historial */
         <div className="space-y-4">
           {/* Contador de resultados */}
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-900">
               Historial de Cambios
               {historial.length > 0 && (
                 <span className="text-sm font-normal text-gray-500 ml-2">
                   ({historial.length} registros encontrados)
                 </span>
               )}
             </h3>
           </div>
                     {loading ? (
             <div className="text-center py-12">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
               <p className="mt-4 text-gray-600">Cargando historial...</p>
             </div>
                      ) : error ? (
             <Card>
               <CardContent className="text-center py-12">
                 <div className="text-6xl mb-4">⚠️</div>
                 <p className="text-red-600 text-lg mb-2">Error al cargar el historial</p>
                 <p className="text-sm text-gray-600 mb-4">{error}</p>
                 <Button 
                   onClick={cargarHistorial} 
                   variant="outline" 
                   className="mt-4"
                 >
                   🔄 Reintentar
                 </Button>
               </CardContent>
             </Card>
           ) : historial.length === 0 ? (
             <Card>
               <CardContent className="text-center py-12">
                 <div className="text-6xl mb-4">📋</div>
                 <p className="text-gray-600 text-lg mb-2">No se encontraron registros en el historial</p>
                 <p className="text-sm text-gray-400">Esto puede deberse a que no hay movimientos registrados o a un problema temporal de conexión</p>
                 <Button 
                   onClick={cargarHistorial} 
                   variant="outline" 
                   className="mt-4"
                 >
                   🔄 Reintentar
                 </Button>
               </CardContent>
             </Card>
          ) : (
            historial.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icono del tipo de cambio */}
                      <div className="text-3xl bg-gray-100 p-3 rounded-full">
                        {getTipoCambioIcon(item.tipo_cambio)}
                      </div>
                      
                      {/* Contenido principal */}
                      <div className="flex-1">
                        {/* Header con tipo de cambio y fecha */}
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={`${getTipoCambioColor(item.tipo_cambio)} text-sm font-medium`}>
                            {item.tipo_cambio || 'N/A'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatearFechaRelativa(item.created_at)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({formatearFecha(item.created_at)})
                          </span>

                        </div>
                        
                        {/* Usuario que realizó la acción */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUsuarioExpandido(item.usuario.id)}
                              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer relative"
                              title="Ver información del usuario"
                            >
                              <span className="text-sm font-medium text-blue-600">
                                {item.usuario.nombre.charAt(0)}{item.usuario.apellido.charAt(0)}
                              </span>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                {usuariosExpandidos.has(item.usuario.id) ? (
                                  <span className="text-white text-xs font-bold">−</span>
                                ) : (
                                  <span className="text-white text-xs font-bold">+</span>
                                )}
                              </div>
                            </button>
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900">
                                {item.usuario.nombre} {item.usuario.apellido}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {item.usuario.rol || 'Usuario'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Información expandida del usuario */}
                          {usuariosExpandidos.has(item.usuario.id) && (
                            <div className="mt-2 ml-10 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-blue-800">ID:</span>
                                  <span className="text-gray-700 ml-1">{item.usuario.id}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-800">Rol:</span>
                                  <span className="text-gray-700 ml-1">{item.usuario.rol || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-800">Nombre:</span>
                                  <span className="text-gray-700 ml-1">{item.usuario.nombre}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-800">Apellido:</span>
                                  <span className="text-gray-700 ml-1">{item.usuario.apellido}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Descripción de la acción */}
                        <div className="mb-3">
                          <p className="text-gray-700">
                            <span className="font-medium">{item.usuario.nombre}</span>{' '}
                            {getDescripcionAccion(item.tipo_cambio, item.detalles_despues, item.modulo)}
                            {item.detalles_despues && item.detalles_despues.monto_total && (
                              <span className="font-medium text-blue-600">
                                {' '}por ${item.detalles_despues.monto_total}
                              </span>
                            )}
                            {item.detalles_despues && item.detalles_despues.estado && (
                              <span className="font-medium text-green-600 ml-2">
                                ({item.detalles_despues.estado})
                              </span>
                            )}
                          </p>
                          

                          
                          {/* Detalles adicionales del cobro */}
                          {item.detalles_despues && typeof item.detalles_despues === 'object' && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {item.detalles_despues.monto_total && (
                                  <div>
                                    <span className="font-medium text-gray-700">Monto:</span>
                                    <span className="text-gray-600 ml-1">${item.detalles_despues.monto_total}</span>
                                  </div>
                                )}
                                {item.detalles_despues.estado && (
                                  <div>
                                    <span className="font-medium text-gray-700">Estado:</span>
                                    <Badge className="ml-1" variant="outline">{item.detalles_despues.estado}</Badge>
                                  </div>
                                )}
                                {item.detalles_despues.notas && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium text-gray-700">Notas:</span>
                                    <span className="text-gray-600 ml-1">{item.detalles_despues.notas}</span>
                                  </div>
                                )}
                                {item.detalles_despues.fecha_cobro && (
                                  <div>
                                    <span className="font-medium text-gray-700">Fecha:</span>
                                    <span className="text-gray-600 ml-1">
                                      {new Date(item.detalles_despues.fecha_cobro).toLocaleDateString('es-ES')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Detalles resumidos */}
                        {item.detalles_despues && (
                          <div className="mb-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Detalles:</span>{' '}
                                {getDetallesResumidos(item.detalles_despues, item.modulo) || 'Información del cobro'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Detalles completos expandibles */}
                        {item.detalles_despues && (
                          <div className="text-sm text-gray-600">
                            <details className="cursor-pointer">
                              <summary className="font-medium text-blue-600 hover:text-blue-800">
                                📋 Ver detalles completos
                              </summary>
                              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {item.detalles_antes && (
                                    <div>
                                      <h4 className="font-medium text-red-600 mb-2">Antes:</h4>
                                      <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(item.detalles_antes, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium text-green-600 mb-2">Después:</h4>
                                    <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(item.detalles_despues, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Vista de Estadísticas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {estadisticas && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Registros</p>
                      <p className="text-2xl font-bold text-gray-900">{estadisticas.totalRegistros}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              {estadisticas.cambiosPorTipo.map((tipo) => (
                <Card key={tipo.tipo_cambio}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{tipo.tipo_cambio}</p>
                        <p className="text-2xl font-bold text-gray-900">{tipo._count.tipo_cambio}</p>
                      </div>
                      <div className="text-2xl">
                        {getTipoCambioIcon(tipo.tipo_cambio)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
