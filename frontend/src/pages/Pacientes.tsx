import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPacientes, crearPaciente, actualizarPaciente, borrarPaciente } from "@/services/pacientesService";
import CuestionarioPacientes from '@/components/CuestionarioPacientes';
import { NativeDatePicker } from "@/components/ui/native-date-picker";
import { ImmunotherapyRecordButton } from '@/components/inventario/immunotherapy-record';
import { usePermisos } from '@/hooks/usePermisos';
import PatientSearchBar from '@/components/PatientSearchBar';

const pacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  genero: z.string().min(1, "El género es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  fecha_nacimiento: z.string().optional(),
});

type PacienteForm = z.infer<typeof pacienteSchema>;

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [filteredPacientes, setFilteredPacientes] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editPaciente, setEditPaciente] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showCuestionario, setShowCuestionario] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [fechaNacimientoEdit, setFechaNacimientoEdit] = useState<Date | null>(null);

  const { organizacion } = usePermisos();

  // Debug: Log organizacion object
  useEffect(() => {
    console.log('🔍 Debug - Organizacion object:', organizacion);
  }, [organizacion]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PacienteForm>({
    resolver: zodResolver(pacienteSchema),
  });

  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      const data = await getPacientes();
      setPacientes(data);
      setFilteredPacientes(data);
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    }
  };

  const handleSearchResults = (results: any[]) => {
    setFilteredPacientes(results);
    setIsSearchActive(true);
  };

  const handleClearSearch = () => {
    setFilteredPacientes(pacientes);
    setIsSearchActive(false);
  };

  const onSubmit = async (data: PacienteForm) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validar que la fecha de nacimiento esté seleccionada
    if (!fechaNacimiento) {
      setErrorMsg("La fecha de nacimiento es requerida");
      setLoading(false);
      return;
    }

    // Formatear la fecha de nacimiento a string YYYY-MM-DD
    let pacienteData = { ...data };
    pacienteData.fecha_nacimiento = fechaNacimiento.toISOString().split('T')[0];

    try {
      await crearPaciente(pacienteData);
      setSuccessMsg("Paciente registrado correctamente");
      setOpen(false);
      reset();
      setFechaNacimiento(null);
      await loadPacientes();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al registrar el paciente");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await borrarPaciente(deleteId);
      setDeleteId(null);
      await loadPacientes();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al borrar el paciente");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditOpen = (paciente: any) => {
    setEditPaciente({ ...paciente, fecha_nacimiento: paciente.fecha_nacimiento?.slice(0, 10) });
    // Convertir la fecha string a objeto Date para el calendar
    if (paciente.fecha_nacimiento) {
      setFechaNacimientoEdit(new Date(paciente.fecha_nacimiento));
    } else {
      setFechaNacimientoEdit(null);
    }
    setOpen(false);
  };

  const handleOpenCuestionario = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setShowCuestionario(true);
  };

  const handleEditSubmit = async (data: PacienteForm) => {
    if (!editPaciente) return;
    setEditLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validar que la fecha de nacimiento esté seleccionada
    if (!fechaNacimientoEdit) {
      setErrorMsg("La fecha de nacimiento es requerida");
      setEditLoading(false);
      return;
    }

    // Formatear la fecha de nacimiento a string YYYY-MM-DD
    let pacienteData = { ...data };
    pacienteData.fecha_nacimiento = fechaNacimientoEdit.toISOString().split('T')[0];

    try {
      await actualizarPaciente(editPaciente.id, pacienteData);
      setEditPaciente(null);
      setFechaNacimientoEdit(null);
      setSuccessMsg("Paciente actualizado correctamente");
      await loadPacientes();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al actualizar el paciente");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] pt-10">
      {/* Header con título y botón de nuevo paciente */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold text-[#4285f2]">Gestión de Pacientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              className="bg-[#4285f2] text-white h-14 px-10 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-2xl font-bold"
            >
              Nuevo paciente
            </button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-8">
        <PatientSearchBar
          pacientes={pacientes}
          onSearchResults={handleSearchResults}
          onClearSearch={handleClearSearch}
          placeholder="Buscar pacientes por nombre, email, teléfono o fecha de nacimiento..."
          className="w-full"
        />
      </div>

      {/* Información de resultados */}
      {isSearchActive && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-800 font-medium">
                Mostrando {filteredPacientes.length} de {pacientes.length} pacientes
              </span>
            </div>
            <button
              onClick={handleClearSearch}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
            >
              Ver todos los pacientes
            </button>
          </div>
        </div>
      )}
      {/* Tabla de pacientes */}
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full border text-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-8 py-5 text-gray-700 text-lg">ID</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Nombre</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Apellido</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Email</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Teléfono</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Fecha Nacimiento</th>
              <th className="border px-8 py-5 text-gray-700 text-lg">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="border px-8 py-12 text-center text-gray-500 text-lg">
                  {isSearchActive ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">No se encontraron pacientes</p>
                        <p className="text-sm">Intenta con otros términos de búsqueda</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">No hay pacientes registrados</p>
                        <p className="text-sm">Crea tu primer paciente usando el botón "Nuevo paciente"</p>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredPacientes.map((paciente) => (
              <tr key={paciente.id} className="hover:bg-gray-50 transition">
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.id}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.nombre}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.apellido}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.email || "-"}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.telefono || "-"}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">{paciente.fecha_nacimiento?.slice(0,10) || "-"}</td>
                <td className="border px-8 py-5 text-gray-900 text-lg">
                  <button
                    className="bg-[#4285f2] hover:bg-[#4285f2]/90 text-white font-bold py-2 px-4 rounded-lg mr-2 text-lg shadow"
                    onClick={() => handleEditOpen(paciente)}
                  >
                    Editar
                  </button>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg mr-2 text-lg shadow"
                    onClick={() => handleOpenCuestionario(paciente.id)}
                  >
                    Cuestionario
                  </button>
                  <ImmunotherapyRecordButton
                    pacienteId={paciente.id}
                    organizacionId={organizacion?.id || 'default-org-id'}
                    hasRecord={false} // TODO: Implement async check for each patient
                    variant="outline"
                    size="sm"
                  />
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-lg shadow"
                    onClick={() => setDeleteId(paciente.id)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-[#4285f2]">Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 mt-6">
            <div>
              <label className="block text-lg font-medium mb-2">Nombre *</label>
              <Input
                {...register("nombre")}
                placeholder="Nombre del paciente"
                className="h-12 px-4 text-lg"
              />
              {errors.nombre && (
                <p className="text-red-500 text-base mt-1">{errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Apellido *</label>
              <Input
                {...register("apellido")}
                placeholder="Apellido del paciente"
                className="h-12 px-4 text-lg"
              />
              {errors.apellido && (
                <p className="text-red-500 text-base mt-1">{errors.apellido.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Género *</label>
              <select
                {...register("genero")}
                className="h-12 px-4 text-lg border rounded w-full text-gray-900 bg-white"
                defaultValue=""
              >
                <option value="" disabled>Selecciona género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.genero && (
                <p className="text-red-500 text-base mt-1">{errors.genero.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Email *</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="email@ejemplo.com"
                className="h-12 px-4 text-lg"
              />
              {errors.email && (
                <p className="text-red-500 text-base mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Teléfono *</label>
              <Input
                {...register("telefono")}
                placeholder="+1234567890"
                className="h-12 px-4 text-lg"
              />
              {errors.telefono && (
                <p className="text-red-500 text-base mt-1">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Fecha de Nacimiento *</label>
              <NativeDatePicker
                selected={fechaNacimiento}
                onChange={setFechaNacimiento}
                placeholder="Fecha de nacimiento"
                className="h-12"
                enableQuickNavigation={true}
                yearRange="past"
              />
              {!fechaNacimiento && (
                <p className="text-red-500 text-base mt-1">La fecha de nacimiento es requerida</p>
              )}
            </div>
            {errorMsg && (
              <p className="text-red-500 text-base">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-green-500 text-base">{successMsg}</p>
            )}
            <div className="flex justify-end space-x-4 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-12 px-6 text-lg font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 transition text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-6 text-lg font-semibold rounded bg-[#4285f2] text-white hover:bg-[#4285f2]/90 transition shadow"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-md p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">¿Eliminar paciente?</DialogTitle>
          </DialogHeader>
          <p className="text-lg mb-6">Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este paciente?</p>
          <div className="flex justify-end gap-4">
            <button
              className="h-12 px-6 text-lg font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 transition text-gray-900"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </button>
            <button
              className="h-12 px-6 text-lg font-semibold rounded bg-red-500 text-white hover:bg-red-600 transition shadow"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPaciente} onOpenChange={v => !v && setEditPaciente(null)}>
        <DialogContent className="max-w-2xl p-10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-[#4285f2]">Editar Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)} className="flex flex-col gap-8 mt-6">
            <div>
              <label className="block text-lg font-medium mb-2">Nombre *</label>
              <Input
                {...register("nombre")}
                defaultValue={editPaciente?.nombre}
                placeholder="Nombre del paciente"
                className="h-12 px-4 text-lg"
              />
              {errors.nombre && (
                <p className="text-red-500 text-base mt-1">{errors.nombre.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Apellido *</label>
              <Input
                {...register("apellido")}
                defaultValue={editPaciente?.apellido}
                placeholder="Apellido del paciente"
                className="h-12 px-4 text-lg"
              />
              {errors.apellido && (
                <p className="text-red-500 text-base mt-1">{errors.apellido.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Género *</label>
              <select
                {...register("genero")}
                defaultValue={editPaciente?.genero}
                className="h-12 px-4 text-lg border rounded w-full text-gray-900 bg-white"
              >
                <option value="" disabled>Selecciona género</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.genero && (
                <p className="text-red-500 text-base mt-1">{errors.genero.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Email *</label>
              <Input
                {...register("email")}
                defaultValue={editPaciente?.email}
                type="email"
                placeholder="email@ejemplo.com"
                className="h-12 px-4 text-lg"
              />
              {errors.email && (
                <p className="text-red-500 text-base mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Teléfono *</label>
              <Input
                {...register("telefono")}
                defaultValue={editPaciente?.telefono}
                placeholder="+1234567890"
                className="h-12 px-4 text-lg"
              />
              {errors.telefono && (
                <p className="text-red-500 text-base mt-1">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <label className="block text-lg font-medium mb-2">Fecha de Nacimiento *</label>
              <NativeDatePicker
                selected={fechaNacimientoEdit}
                onChange={setFechaNacimientoEdit}
                placeholder="Fecha de nacimiento"
                className="h-12"
                enableQuickNavigation={true}
                yearRange="past"
              />
              {!fechaNacimientoEdit && (
                <p className="text-red-500 text-base mt-1">La fecha de nacimiento es requerida</p>
              )}
            </div>
            {errorMsg && (
              <p className="text-red-500 text-base">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-green-500 text-base">{successMsg}</p>
            )}
            <div className="flex justify-end space-x-4 pt-2">
              <button
                type="button"
                onClick={() => setEditPaciente(null)}
                className="h-12 px-6 text-lg font-semibold rounded border border-gray-300 bg-white hover:bg-gray-100 transition text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="h-12 px-6 text-lg font-semibold rounded bg-[#4285f2] text-white hover:bg-[#4285f2]/90 transition shadow"
              >
                {editLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gestionar Cuestionario de Pacientes */}
      <Dialog open={showCuestionario} onOpenChange={setShowCuestionario}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 rounded-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-3xl font-bold text-[#4285f2]">Cuestionario de Pacientes</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <CuestionarioPacientes 
              embedded={true} 
              pacienteId={selectedPacienteId || undefined}
              onGuardar={(datos) => {
                console.log('Cuestionario guardado:', datos);
                setShowCuestionario(false);
                setSelectedPacienteId(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 