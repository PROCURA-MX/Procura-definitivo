import { useState, useEffect } from 'react'
import { useDisponibilidadesMedico, DisponibilidadMedico } from '../hooks/useDisponibilidadesMedico'
import { useBloqueosMedico, BloqueoMedico } from '../hooks/useBloqueosMedico'
import { getUsuarios } from '../services/usuariosService'
import '../services/conceptosService' // Importar para inicializar interceptores de axios
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from '../components/ui/select'
import { TimePicker } from '../components/ui/time-picker'
import { DateTimePicker } from '../components/ui/date-time-picker'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  rol: string
}

function DisponibilidadBloqueos() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [selectedMedico, setSelectedMedico] = useState<string>('')
  const [tab, setTab] = useState<'disponibilidad' | 'bloqueos'>('disponibilidad')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<DisponibilidadMedico | BloqueoMedico | null>(null)

  // Hooks de datos
  const {
    disponibilidades,
    isLoading: isLoadingDisponibilidad,
    error: errorDisponibilidad,
    fetchDisponibilidades,
    create: createDisponibilidad,
    update: updateDisponibilidad,
    remove: removeDisponibilidad
  } = useDisponibilidadesMedico(selectedMedico)

  const {
    bloqueos,
    isLoading: isLoadingBloqueos,
    error: errorBloqueos,
    fetchBloqueos,
    create: createBloqueo,
    update: updateBloqueo,
    remove: removeBloqueo
  } = useBloqueosMedico(selectedMedico)

  // Cargar médicos
  useEffect(() => {
    getUsuarios('DOCTOR').then(users => {
      setUsuarios(users)
      if (!selectedMedico && users.length > 0) setSelectedMedico(users[0].id)
    }).catch(error => {
      console.error('Error cargando médicos:', error)
      setUsuarios([])
    })
  }, [])

  // Recargar al cambiar médico
  useEffect(() => {
    if (selectedMedico) {
      fetchDisponibilidades()
      fetchBloqueos()
    }
  }, [selectedMedico])

  // Formularios modales
  function handleEdit(item: DisponibilidadMedico | BloqueoMedico) {
    setEditItem(item)
    setShowForm(true)
  }
  function handleNew() {
    setEditItem(null)
    setShowForm(true)
  }
  function handleClose() {
    setShowForm(false)
    setEditItem(null)
  }

  // Render
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-start py-10 px-2">
      <div className="w-full max-w-3xl mx-auto">
        {/* Botón para regresar al calendario */}
        <div className="mb-6">
          <a
            href="/calendario"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors shadow"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Regresar al Calendario
          </a>
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-center">Gestión de Disponibilidad y Bloqueos de Médico</h1>
        <div className="flex gap-4 mb-6 items-center justify-center">
          <label className="font-semibold">Médico:</label>
          <div className="w-64">
            <Select value={selectedMedico} onValueChange={setSelectedMedico}>
              <SelectTrigger className="w-full bg-white border text-gray-900">
                <SelectValue placeholder={usuarios.length === 0 ? 'No hay médicos disponibles' : 'Selecciona un médico'} />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900">
                {usuarios.length === 0 && <div className="px-4 py-2 text-gray-500">No hay médicos registrados</div>}
                {usuarios.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant={tab === 'disponibilidad' ? 'default' : 'outline'} onClick={() => setTab('disponibilidad')}>Disponibilidad</Button>
            <Button variant={tab === 'bloqueos' ? 'default' : 'outline'} onClick={() => setTab('bloqueos')}>Bloqueos</Button>
          </div>
        </div>
        {usuarios.length === 0 && (
          <div className="text-center text-red-500 font-semibold mb-8">No hay médicos registrados. Agrega médicos en la sección de usuarios.</div>
        )}
        {usuarios.length > 0 && tab === 'disponibilidad' && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración de Disponibilidad Semanal</h2>
              <p className="text-gray-600">Configura los horarios de disponibilidad para cada día de la semana</p>
            </div>
            
            {isLoadingDisponibilidad ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando disponibilidad...</p>
              </div>
            ) : errorDisponibilidad ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errorDisponibilidad}
              </div>
            ) : (
              <DisponibilidadDirecta
                disponibilidades={disponibilidades}
                onCreate={createDisponibilidad}
                onUpdate={updateDisponibilidad}
                onRemove={removeDisponibilidad}
                medicoId={selectedMedico}
              />
            )}
          </section>
        )}
        {usuarios.length > 0 && tab === 'bloqueos' && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración de Bloqueos</h2>
              <p className="text-gray-600">Configura los bloqueos de tiempo para evitar citas en horarios específicos</p>
            </div>
            
            {isLoadingBloqueos ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando bloqueos...</p>
              </div>
            ) : errorBloqueos ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errorBloqueos}
              </div>
            ) : (
              <BloqueosDirectos
                bloqueos={bloqueos}
                onCreate={createBloqueo}
                onUpdate={updateBloqueo}
                onRemove={removeBloqueo}
                medicoId={selectedMedico}
              />
            )}
          </section>
        )}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogTitle>{editItem ? 'Editar' : 'Agregar'} {tab === 'disponibilidad' ? 'Disponibilidad' : 'Bloqueo'}</DialogTitle>
            {tab === 'disponibilidad' ? (
              <DisponibilidadForm
                initial={editItem as DisponibilidadMedico | undefined}
                medicoId={selectedMedico}
                onSave={async values => {
                  if (editItem) await updateDisponibilidad(editItem.id, values)
                  else await createDisponibilidad({ ...values, usuario_id: selectedMedico })
                  handleClose()
                }}
                onCancel={handleClose}
              />
            ) : (
              <BloqueoForm
                initial={editItem as BloqueoMedico | undefined}
                medicoId={selectedMedico}
                onSave={async values => {
                  if (editItem) await updateBloqueo(editItem.id, values)
                  else await createBloqueo({ ...values, usuario_id: selectedMedico })
                  handleClose()
                }}
                onCancel={handleClose}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

function DisponibilidadForm({ initial, medicoId, onSave, onCancel }:{
  initial?: DisponibilidadMedico
  medicoId: string
  onSave: (values: { dia_semana: number; hora_inicio: string; hora_fin: string }) => void
  onCancel: () => void
}) {
  const [disponibilidades, setDisponibilidades] = useState<Array<{
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);

  // Inicializar con la disponibilidad existente si estamos editando
  useEffect(() => {
    if (initial) {
      setDisponibilidades([{
        dia_semana: initial.dia_semana,
        hora_inicio: initial.hora_inicio,
        hora_fin: initial.hora_fin
      }]);
    }
  }, [initial]);

  const diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  const agregarHorario = (diaId: number, inicio: string, fin: string) => {
    setDisponibilidades(prev => [...prev, { dia_semana: diaId, hora_inicio: inicio, hora_fin: fin }]);
  };

  const eliminarHorario = (index: number) => {
    setDisponibilidades(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarHorario = (index: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    setDisponibilidades(prev => prev.map((item, i) => 
      i === index ? { ...item, [campo]: valor } : item
    ));
  };

  const guardarTodo = async () => {
    if (disponibilidades.length === 0) {
      setError('Debes agregar al menos un horario');
      return;
    }

    try {
      // Si estamos editando, solo guardamos el primer elemento
      if (initial) {
        await onSave(disponibilidades[0]);
      } else {
        // Si es nuevo, guardamos todas las disponibilidades
        for (const disp of disponibilidades) {
          await onSave(disp);
        }
      }
    } catch (error) {
      setError('Error al guardar la disponibilidad');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {initial ? 'Editar Disponibilidad' : 'Configurar Disponibilidad Semanal'}
        </h3>
        <p className="text-sm text-gray-600">
          {initial ? 'Modifica el horario seleccionado' : 'Agrega horarios para cada día de la semana'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">
          {initial ? 'Horario Actual' : 'Horarios Configurados'}
        </h4>
        
        {disponibilidades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {initial ? 'No hay horario configurado' : 'No hay horarios agregados. Usa los horarios comunes arriba o agrega manualmente.'}
          </div>
        ) : (
          <div className="space-y-3">
            {disponibilidades.map((disp, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {diasSemana.find(d => d.id === disp.dia_semana)?.nombre}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <TimePicker
                      value={disp.hora_inicio}
                      onChange={(value) => actualizarHorario(index, 'hora_inicio', value)}
                      placeholder="Hora inicio"
                    />
                    <span className="text-gray-500">a</span>
                    <TimePicker
                      value={disp.hora_fin}
                      onChange={(value) => actualizarHorario(index, 'hora_fin', value)}
                      placeholder="Hora fin"
                    />
                  </div>
                </div>
                <button
                  onClick={() => eliminarHorario(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!initial && (
          <div className="border-t pt-4">
            <h5 className="font-medium text-gray-900 mb-3">Agregar Horario Manual</h5>
            <div className="flex items-center gap-3">
              <select
                className="flex-1 p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                onChange={(e) => {
                  const diaId = parseInt(e.target.value);
                  if (diaId !== -1) {
                    agregarHorario(diaId, '09:00', '17:00');
                    e.target.value = '-1'; // Reset
                  }
                }}
                defaultValue="-1"
              >
                <option value="-1">Seleccionar día</option>
                {diasSemana.map(dia => (
                  <option key={dia.id} value={dia.id}>{dia.nombre}</option>
                ))}
              </select>
              <span className="text-gray-500">con horario</span>
              <TimePicker
                value="09:00"
                onChange={(value) => {
                  // Actualizar el último horario agregado
                  if (disponibilidades.length > 0) {
                    actualizarHorario(disponibilidades.length - 1, 'hora_inicio', value);
                  }
                }}
                placeholder="Inicio"
              />
              <span className="text-gray-500">a</span>
              <TimePicker
                value="17:00"
                onChange={(value) => {
                  // Actualizar el último horario agregado
                  if (disponibilidades.length > 0) {
                    actualizarHorario(disponibilidades.length - 1, 'hora_fin', value);
                  }
                }}
                placeholder="Fin"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={guardarTodo}>
          {initial ? 'Actualizar' : 'Guardar Disponibilidad'}
        </Button>
      </div>
    </div>
  );
}

function BloqueoForm({ initial, medicoId, onSave, onCancel }:{
  initial?: BloqueoMedico
  medicoId: string
  onSave: (values: { usuario_id: string; fecha_inicio: string; fecha_fin: string; motivo: string }) => void
  onCancel: () => void
}) {
  const [fecha_inicio, setFechaInicio] = useState<Date | null>(
    initial?.fecha_inicio ? new Date(initial.fecha_inicio) : null
  )
  const [fecha_fin, setFechaFin] = useState<Date | null>(
    initial?.fecha_fin ? new Date(initial.fecha_fin) : null
  )
  const [motivo, setMotivo] = useState(initial?.motivo ?? '')
  const [error, setError] = useState<string | null>(null)

  function validate() {
    setError(null)
    if (!fecha_inicio || !fecha_fin) {
      setError('Debes ingresar fecha y hora de inicio y fin')
      return false
    }
    if (fecha_inicio >= fecha_fin) {
      setError('La fecha/hora de inicio debe ser menor que la de fin')
      return false
    }
    const now = new Date()
    if (fecha_inicio < now) {
      setError('No puedes crear bloqueos en el pasado')
      return false
    }
    return true
  }

  return (
    <form className="space-y-4" onSubmit={e => {
      e.preventDefault()
      if (!validate()) return
      onSave({
        usuario_id: medicoId,
        fecha_inicio: fecha_inicio?.toISOString() || '',
        fecha_fin: fecha_fin?.toISOString() || '',
        motivo
      })
    }}>
      <label className="block">Fecha y hora inicio
        <DateTimePicker 
          value={fecha_inicio} 
          onChange={setFechaInicio} 
          placeholder="Seleccionar fecha y hora de inicio"
        />
      </label>
      <label className="block">Fecha y hora fin
        <DateTimePicker 
          value={fecha_fin} 
          onChange={setFechaFin} 
          placeholder="Seleccionar fecha y hora de fin"
        />
      </label>
      <label className="block">Motivo
        <Input value={motivo} onChange={e => setMotivo(e.target.value)} />
      </label>
      {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={!!error}>Guardar</Button>
      </div>
    </form>
  )
}

// Componente para manejar disponibilidad directamente sin modal
function DisponibilidadDirecta({ 
  disponibilidades, 
  onCreate, 
  onUpdate, 
  onRemove, 
  medicoId 
}: {
  disponibilidades: DisponibilidadMedico[]
  onCreate: (values: { usuario_id: string; dia_semana: number; hora_inicio: string; hora_fin: string }) => Promise<void>
  onUpdate: (id: string, values: { dia_semana: number; hora_inicio: string; hora_fin: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  medicoId: string
}) {
  const [disponibilidadesEdit, setDisponibilidadesEdit] = useState<Array<{
    id?: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    isNew?: boolean;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [horarioTemporal, setHorarioTemporal] = useState({ inicio: '09:00', fin: '17:00' });

  const diasSemana = [
    { id: 1, nombre: 'Lunes' },
    { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' },
    { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' },
    { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  // Inicializar con todos los días de la semana
  useEffect(() => {
    // Crear un mapa de disponibilidades existentes
    const disponibilidadesMap = new Map();
    disponibilidades.forEach(d => {
      disponibilidadesMap.set(d.dia_semana, {
        id: d.id,
        dia_semana: d.dia_semana,
        hora_inicio: d.hora_inicio,
        hora_fin: d.hora_fin,
        isNew: false
      });
    });

    // Crear array con todos los días de la semana
    const todosLosDias = diasSemana.map(dia => {
      return disponibilidadesMap.get(dia.id) || {
        dia_semana: dia.id,
        hora_inicio: '',
        hora_fin: '',
        isNew: false
      };
    });

    setDisponibilidadesEdit(todosLosDias);
  }, [disponibilidades]); // Ahora se actualiza cada vez que cambian los datos del servidor

  const agregarHorario = (diaId: number, inicio: string, fin: string) => {
    setDisponibilidadesEdit(prev => {
      const newList = prev.map(item => 
        item.dia_semana === diaId 
          ? { 
              ...item, 
              hora_inicio: inicio, 
              hora_fin: fin, 
              // Solo marcar como nueva si no tiene ID
              isNew: !item.id 
            }
          : item
      );
      return newList;
    });
  };

  const agregarHorarioMultiple = (dias: number[], inicio: string, fin: string) => {
    setDisponibilidadesEdit(prev => {
      const newList = prev.map(item => 
        dias.includes(item.dia_semana)
          ? { 
              ...item, 
              hora_inicio: inicio, 
              hora_fin: fin, 
              // Solo marcar como nueva si no tiene ID
              isNew: !item.id 
            }
          : item
      );
      return newList;
    });
  };

  const eliminarHorario = (diaId: number) => {
    const item = disponibilidadesEdit.find(d => d.dia_semana === diaId);
    if (item?.id && !item.isNew) {
      // Si tiene ID, eliminar de la base de datos
      onRemove(item.id);
    }
    setDisponibilidadesEdit(prev => prev.map(d => 
      d.dia_semana === diaId 
        ? { ...d, hora_inicio: '', hora_fin: '', isNew: false }
        : d
    ));
  };

  const actualizarHorario = (diaId: number, campo: 'hora_inicio' | 'hora_fin', valor: string) => {
    setDisponibilidadesEdit(prev => prev.map(item => 
      item.dia_semana === diaId 
        ? { 
            ...item, 
            [campo]: valor, 
            // Solo marcar como nueva si no tiene ID (es decir, si realmente es nueva)
            isNew: !item.id 
          }
        : item
    ));
  };

  const guardarCambios = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Guardar nuevos horarios y actualizar existentes
      for (const disp of disponibilidadesEdit.filter(d => d.hora_inicio && d.hora_fin)) {
        if (disp.id && !disp.isNew) {
          // Actualizar horario existente
          await onUpdate(disp.id, {
            dia_semana: disp.dia_semana,
            hora_inicio: disp.hora_inicio,
            hora_fin: disp.hora_fin
          });
        } else {
          // Crear nuevo horario
          await onCreate({
            usuario_id: medicoId,
            dia_semana: disp.dia_semana,
            hora_inicio: disp.hora_inicio,
            hora_fin: disp.hora_fin
          });
        }
      }

      // Notificar cambio para sincronizar con otras páginas
      localStorage.setItem('disponibilidades_updated', Date.now().toString());
      console.log('✅ Cambios guardados y notificados a otras páginas');
      
      // Los datos se actualizarán automáticamente desde el servidor
      // gracias al hook que llama fetchDisponibilidades después de cada operación
    } catch (error) {
      setError('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Opciones de Horarios Múltiples */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Agregar Horarios Múltiples</h4>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Horario:</span>
            <TimePicker
              value={horarioTemporal.inicio}
              onChange={(value) => setHorarioTemporal(prev => ({ ...prev, inicio: value }))}
              placeholder="Inicio"
            />
            <span className="text-gray-500">a</span>
            <TimePicker
              value={horarioTemporal.fin}
              onChange={(value) => setHorarioTemporal(prev => ({ ...prev, fin: value }))}
              placeholder="Fin"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => agregarHorarioMultiple([1,2,3,4,5,6,0], horarioTemporal.inicio, horarioTemporal.fin)}
            className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-blue-900">Toda la semana</div>
            <div className="text-sm text-blue-600">Lunes a Domingo</div>
          </button>
          <button
            onClick={() => agregarHorarioMultiple([1,2,3,4,5], horarioTemporal.inicio, horarioTemporal.fin)}
            className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-blue-900">Lunes a Viernes</div>
            <div className="text-sm text-blue-600">Días laborables</div>
          </button>
          <button
            onClick={() => agregarHorarioMultiple([1,2,3,4,5,6], horarioTemporal.inicio, horarioTemporal.fin)}
            className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-blue-900">Lunes a Sábado</div>
            <div className="text-sm text-blue-600">Incluye sábado</div>
          </button>
        </div>
      </div>

      {/* Horarios por Día */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Horarios por Día</h4>
        
        <div className="space-y-3">
          {disponibilidadesEdit.map((disp) => (
            <div key={disp.dia_semana} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-24">
                <div className="font-medium text-gray-900">
                  {diasSemana.find(d => d.id === disp.dia_semana)?.nombre}
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <TimePicker
                  value={disp.hora_inicio}
                  onChange={(value) => actualizarHorario(disp.dia_semana, 'hora_inicio', value)}
                  placeholder="Hora inicio"
                />
                <span className="text-gray-500">a</span>
                <TimePicker
                  value={disp.hora_fin}
                  onChange={(value) => actualizarHorario(disp.dia_semana, 'hora_fin', value)}
                  placeholder="Hora fin"
                />
                {disp.isNew && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Nuevo</span>}
              </div>
              {(disp.hora_inicio || disp.hora_fin) && (
                <button
                  onClick={() => eliminarHorario(disp.dia_semana)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Guardar */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={guardarCambios} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}

// Componente para manejar bloqueos directamente sin modal
function BloqueosDirectos({ 
  bloqueos, 
  onCreate, 
  onUpdate, 
  onRemove, 
  medicoId 
}: {
  bloqueos: BloqueoMedico[]
  onCreate: (values: { usuario_id: string; fecha_inicio: string; fecha_fin: string; motivo: string }) => Promise<void>
  onUpdate: (id: string, values: { fecha_inicio: string; fecha_fin: string; motivo: string }) => Promise<void>
  onRemove: (id: string) => Promise<void>
  medicoId: string
}) {
  const [bloqueosEdit, setBloqueosEdit] = useState<Array<{
    id?: string;
    fecha_inicio: Date | null;
    fecha_fin: Date | null;
    motivo: string;
    isNew?: boolean;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fecha_inicio: null as Date | null,
    fecha_fin: null as Date | null,
    motivo: ''
  });

  // Inicializar con bloqueos existentes
  useEffect(() => {
    const editData = bloqueos.map(b => ({
      id: b.id,
      fecha_inicio: new Date(b.fecha_inicio),
      fecha_fin: new Date(b.fecha_fin),
      motivo: b.motivo || '',
      isNew: false
    }));
    setBloqueosEdit(editData);
  }, [bloqueos]);

  const agregarBloqueo = () => {
    if (!nuevoBloqueo.fecha_inicio || !nuevoBloqueo.fecha_fin || !nuevoBloqueo.motivo.trim()) {
      setError('Debes completar todos los campos');
      return;
    }

    if (nuevoBloqueo.fecha_inicio >= nuevoBloqueo.fecha_fin) {
      setError('La fecha/hora de inicio debe ser menor que la de fin');
      return;
    }

    const now = new Date();
    if (nuevoBloqueo.fecha_inicio < now) {
      setError('No puedes crear bloqueos en el pasado');
      return;
    }

    setBloqueosEdit(prev => [...prev, {
      fecha_inicio: nuevoBloqueo.fecha_inicio,
      fecha_fin: nuevoBloqueo.fecha_fin,
      motivo: nuevoBloqueo.motivo,
      isNew: true
    }]);

    // Limpiar formulario
    setNuevoBloqueo({
      fecha_inicio: null,
      fecha_fin: null,
      motivo: ''
    });
    setError(null);
  };

  const agregarBloqueoRapido = (tipo: 'hoy' | 'manana' | 'semana') => {
    const now = new Date();
    let fechaInicio: Date;
    let fechaFin: Date;
    let motivo: string;

    switch (tipo) {
      case 'hoy':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
        fechaFin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0);
        motivo = 'Bloqueo día completo - Hoy';
        break;
      case 'manana':
        const manana = new Date(now);
        manana.setDate(manana.getDate() + 1);
        fechaInicio = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 9, 0);
        fechaFin = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 17, 0);
        motivo = 'Bloqueo día completo - Mañana';
        break;
      case 'semana':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
        fechaFin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0);
        motivo = 'Bloqueo semana completa';
        break;
    }

    setBloqueosEdit(prev => [...prev, {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      motivo: motivo,
      isNew: true
    }]);
  };

  const eliminarBloqueo = (index: number) => {
    const bloqueo = bloqueosEdit[index];
    if (bloqueo.id && !bloqueo.isNew) {
      onRemove(bloqueo.id);
    }
    setBloqueosEdit(prev => prev.filter((_, i) => i !== index));
  };

  const actualizarBloqueo = (index: number, campo: 'fecha_inicio' | 'fecha_fin' | 'motivo', valor: Date | string) => {
    setBloqueosEdit(prev => prev.map((item, i) => 
      i === index ? { ...item, [campo]: valor, isNew: true } : item
    ));
  };

  const guardarCambios = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Guardar nuevos bloqueos y actualizar existentes
      for (const bloqueo of bloqueosEdit.filter(b => b.fecha_inicio && b.fecha_fin)) {
        if (bloqueo.id && !bloqueo.isNew) {
          // Actualizar bloqueo existente
          await onUpdate(bloqueo.id, {
            fecha_inicio: bloqueo.fecha_inicio!.toISOString(),
            fecha_fin: bloqueo.fecha_fin!.toISOString(),
            motivo: bloqueo.motivo
          });
        } else {
          // Crear nuevo bloqueo
          await onCreate({
            usuario_id: medicoId,
            fecha_inicio: bloqueo.fecha_inicio!.toISOString(),
            fecha_fin: bloqueo.fecha_fin!.toISOString(),
            motivo: bloqueo.motivo
          });
        }
      }

      // Notificar cambio para sincronizar con otras páginas
      localStorage.setItem('disponibilidades_updated', Date.now().toString());
      console.log('✅ Cambios de bloqueos guardados y notificados a otras páginas');

      // Marcar todos como no nuevos
      setBloqueosEdit(prev => prev.map(item => ({ ...item, isNew: false })));
    } catch (error) {
      setError('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Opciones de Bloqueos Rápidos */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-3">Bloqueos Rápidos</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => agregarBloqueoRapido('hoy')}
            className="text-left p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="font-medium text-red-900">Bloqueo Hoy</div>
            <div className="text-sm text-red-600">9:00 AM - 5:00 PM</div>
          </button>
          <button
            onClick={() => agregarBloqueoRapido('manana')}
            className="text-left p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="font-medium text-red-900">Bloqueo Mañana</div>
            <div className="text-sm text-red-600">9:00 AM - 5:00 PM</div>
          </button>
          <button
            onClick={() => agregarBloqueoRapido('semana')}
            className="text-left p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="font-medium text-red-900">Bloqueo Semana</div>
            <div className="text-sm text-red-600">7 días completos</div>
          </button>
        </div>
      </div>

      {/* Nuevo Bloqueo Personalizado */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Nuevo Bloqueo Personalizado</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora inicio</label>
            <DateTimePicker
              value={nuevoBloqueo.fecha_inicio}
              onChange={(date) => setNuevoBloqueo(prev => ({ ...prev, fecha_inicio: date }))}
              placeholder="Seleccionar fecha y hora de inicio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora fin</label>
            <DateTimePicker
              value={nuevoBloqueo.fecha_fin}
              onChange={(date) => setNuevoBloqueo(prev => ({ ...prev, fecha_fin: date }))}
              placeholder="Seleccionar fecha y hora de fin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              value={nuevoBloqueo.motivo}
              onChange={(e) => setNuevoBloqueo(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Ej: Vacaciones, Emergencia..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={agregarBloqueo}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Agregar Bloqueo
        </button>
      </div>

      {/* Lista de Bloqueos */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Bloqueos Configurados</h4>
        
        {bloqueosEdit.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay bloqueos configurados. Usa los bloqueos rápidos arriba o agrega uno personalizado.
          </div>
        ) : (
          <div className="space-y-3">
            {bloqueosEdit.map((bloqueo, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">Inicio:</span>
                      <span className="ml-1 text-gray-600">
                        {bloqueo.fecha_inicio ? formatDate(bloqueo.fecha_inicio) : 'No definido'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">Fin:</span>
                      <span className="ml-1 text-gray-600">
                        {bloqueo.fecha_fin ? formatDate(bloqueo.fecha_fin) : 'No definido'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Motivo:</span>
                    <span className="ml-1 text-gray-600">{bloqueo.motivo}</span>
                  </div>
                  {bloqueo.isNew && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Nuevo</span>}
                </div>
                <button
                  onClick={() => eliminarBloqueo(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón de Guardar */}
      {bloqueosEdit.length > 0 && (
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={guardarCambios} 
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper para mostrar fecha/hora local en la tabla
function formatLocal(dt: string) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export default DisponibilidadBloqueos 