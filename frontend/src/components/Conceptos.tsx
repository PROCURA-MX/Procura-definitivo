import { useState } from "react";
import { useConceptos } from "../hooks/useConceptos";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { useForm } from "react-hook-form";
import ConceptoPredefinidoSelector from "./ConceptoPredefinidoSelector";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Conceptos({ embedded = false }: { embedded?: boolean }) {
  const { servicios, addServicio, isLoading: loading, error, editServicio, removeServicio: deleteServicio } = useConceptos();
  const { currentUser } = useCurrentUser();
  const [showForm, setShowForm] = useState(false);
  const [showPredefinedSelector, setShowPredefinedSelector] = useState(false);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [claveSat, setClaveSat] = useState("");
  const [claveUnidad, setClaveUnidad] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");
  const [editConcepto, setEditConcepto] = useState<any>(null);
  const [deleteConcepto, setDeleteConcepto] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { register: editRegister, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm({
    defaultValues: { nombre: "", precio_base: "", descripcion: "", clave_sat: "", clave_unidad: "" }
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setSuccessMsg("");
    try {
      await addServicio({ 
        nombre, 
        precio_base: Number(precio), 
        descripcion,
        clave_sat: claveSat || null,
        clave_unidad: claveUnidad || null
      });
      setSuccessMsg("Concepto agregado correctamente");
      setNombre("");
      setPrecio("");
      setDescripcion("");
      setClaveSat("");
      setClaveUnidad("");
      setShowForm(false);
    } catch (err) {
      setFormError("Error al agregar concepto");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePredefinedSelect = async (concepto: any, precio: number) => {
    setFormLoading(true);
    setFormError("");

    try {
      await addServicio({
        nombre: concepto.nombre,
        precio_base: precio,
        descripcion: concepto.descripcion,
        clave_sat: concepto.clave_sat,
        clave_unidad: concepto.clave_unidad,
        es_predefinido: true,
      });

      setSuccessMsg(`Concepto predefinido "${concepto.nombre}" agregado exitosamente`);
      setShowPredefinedSelector(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      setFormError("Error al agregar concepto predefinido");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateCustom = () => {
    setShowPredefinedSelector(false);
    setShowForm(true);
  };

  const handleEdit = (concepto: any) => {
    setEditConcepto(concepto);
    resetEdit({ 
      nombre: concepto.nombre, 
      precio_base: concepto.precio_base, 
      descripcion: concepto.descripcion,
      clave_sat: concepto.clave_sat || "",
      clave_unidad: concepto.clave_unidad || ""
    });
  };

  const handleEditSave = async (data: any) => {
    setEditLoading(true);
    try {
      await editServicio(editConcepto.id, {
        nombre: data.nombre,
        precio_base: Number(data.precio_base),
        descripcion: data.descripcion,
        clave_sat: data.clave_sat || null,
        clave_unidad: data.clave_unidad || null
      });
      setEditConcepto(null);
    } catch (err) {
      console.error("Error al editar:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConcepto) return;
    setDeleteLoading(true);
    try {
      await deleteServicio(deleteConcepto.id);
      setDeleteConcepto(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Cargando conceptos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "w-full max-w-[1600px] pt-10"}>
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-extrabold text-[#4285f2]">Gestión de Conceptos</h1>
        <div className="flex justify-center">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white h-14 px-10 rounded-xl shadow-lg transition text-xl font-bold"
            onClick={() => setShowPredefinedSelector(true)}
          >
            ➕ Agregar Nuevo Concepto
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMsg}
          </div>
        )}
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}
        {/* ✅ SCROLL VERTICAL: Contenedor con altura máxima y scroll */}
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full border text-xl">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border px-8 py-5 text-gray-700 text-lg">ID</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Nombre</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Precio Base</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Descripción</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Clave SAT</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Clave Unidad</th>
                <th className="border px-8 py-5 text-gray-700 text-lg">Tipo</th>
                <th className="border px-8 py-5 text-gray-700 text-lg text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id} className="hover:bg-gray-50 transition">
                  <td className="border px-8 py-5 text-gray-900">{servicio.id}</td>
                  <td className="border px-8 py-5 text-gray-900">{servicio.nombre}</td>
                  <td className="border px-8 py-5 text-gray-900">${servicio.precio_base}</td>
                  <td className="border px-8 py-5 text-gray-900">{servicio.descripcion || "-"}</td>
                  <td className="border px-8 py-5 text-gray-900">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                      {servicio.clave_sat || "-"}
                    </span>
                  </td>
                  <td className="border px-8 py-5 text-gray-900">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">
                      {servicio.clave_unidad || "-"}
                    </span>
                  </td>
                  <td className="border px-8 py-5 text-gray-900">
                    {servicio.es_predefinido ? (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        📋 Predefinido
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ✏️ Personalizado
                      </span>
                    )}
                  </td>
                  <td className="border px-8 py-5 text-center">
                    <Button
                      className="bg-[#4285f2] text-white h-11 px-7 rounded-lg shadow-lg hover:bg-[#4285f2]/90 transition text-lg font-semibold mr-2"
                      onClick={() => handleEdit(servicio)}
                    >
                      Editar
                    </Button>
                    <Button
                      className="bg-red-500 text-white h-11 px-7 rounded-lg shadow-lg hover:bg-red-600 transition text-lg font-semibold"
                      onClick={() => setDeleteConcepto(servicio)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de alta */}
      <Dialog open={showForm} onOpenChange={v => !v ? setShowForm(false) : null}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#4285f2]">Nuevo Concepto</DialogTitle>
            <DialogDescription>
              Crea un nuevo concepto personalizado para tus servicios médicos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Nombre del concepto"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Precio Base *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Clave SAT</label>
                <input
                  type="text"
                  value={claveSat}
                  onChange={(e) => setClaveSat(e.target.value)}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="ej: 90101501"
                />
                <p className="text-sm text-gray-500 mt-1">Clave del catálogo oficial del SAT</p>
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Clave Unidad</label>
                <input
                  type="text"
                  value={claveUnidad}
                  onChange={(e) => setClaveUnidad(e.target.value)}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="ej: E48"
                />
                <p className="text-sm text-gray-500 mt-1">Unidad de medida del SAT</p>
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-900">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full h-32 px-4 py-3 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                placeholder="Descripción del concepto"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-14 px-8 text-xl font-semibold"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#4285f2] text-white h-14 px-8 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-xl font-bold"
                disabled={formLoading}
              >
                {formLoading ? "Guardando..." : "Guardar Concepto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={!!editConcepto} onOpenChange={v => !v ? setEditConcepto(null) : null}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#4285f2]">Editar Concepto</DialogTitle>
            <DialogDescription>
              Modifica los datos del concepto seleccionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(handleEditSave)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Nombre *</label>
                <input
                  {...editRegister("nombre", { required: "El nombre es requerido" })}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Nombre del concepto"
                />
                {editErrors.nombre && (
                  <span className="text-red-500 text-sm">{editErrors.nombre.message}</span>
                )}
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Precio Base *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...editRegister("precio_base", { 
                    required: "El precio es requerido",
                    min: { value: 0, message: "El precio debe ser mayor a 0" }
                  })}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
                {editErrors.precio_base && (
                  <span className="text-red-500 text-sm">{editErrors.precio_base.message}</span>
                )}
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Clave SAT</label>
                <input
                  {...editRegister("clave_sat")}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="ej: 90101501"
                />
                <p className="text-sm text-gray-500 mt-1">Clave del catálogo oficial del SAT</p>
              </div>
              <div>
                <label className="block text-lg font-semibold mb-2 text-gray-900">Clave Unidad</label>
                <input
                  {...editRegister("clave_unidad")}
                  className="w-full h-14 px-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="ej: E48"
                />
                <p className="text-sm text-gray-500 mt-1">Unidad de medida del SAT</p>
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-900">Descripción</label>
              <textarea
                {...editRegister("descripcion")}
                className="w-full h-32 px-4 py-3 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                placeholder="Descripción del concepto"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-14 px-8 text-xl font-semibold"
                onClick={() => setEditConcepto(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#4285f2] text-white h-14 px-8 rounded-xl shadow-lg hover:bg-[#4285f2]/90 transition text-xl font-bold"
                disabled={editLoading}
              >
                {editLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!deleteConcepto} onOpenChange={v => !v ? setDeleteConcepto(null) : null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el concepto seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg">
              ¿Estás seguro de que quieres eliminar el concepto "{deleteConcepto?.nombre}"?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConcepto(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para selector de conceptos predefinidos */}
      <Dialog open={showPredefinedSelector} onOpenChange={setShowPredefinedSelector}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-blue-600 mb-2">
              📋 Seleccionar Concepto Predefinido
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-lg">
              Elige de nuestra lista de conceptos predefinidos o crea uno personalizado
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <ConceptoPredefinidoSelector
              onSelectPredefined={handlePredefinedSelect}
              onCreateCustom={handleCreateCustom}
              placeholder="🔍 Buscar concepto predefinido..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 