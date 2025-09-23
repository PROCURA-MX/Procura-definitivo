import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  obtenerUsuariosConsultorio, 
  actualizarPermisosUsuario, 
  crearUsuario as crearUsuarioPermisos,
  actualizarUsuario,
  eliminarUsuario,
  ROLES,
  type Usuario as UsuarioPermisos
} from "@/services/permisosService";
import api from "@/services/api";
import { usePermisos, ConditionalRender } from "@/hooks/usePermisos";
import Consultorios from './Consultorios';
import { Combobox } from "@headlessui/react";
import { User, Edit, Trash2, Shield, Settings, Plus } from "lucide-react";

// Schema de validación robusto
const usuarioSchema = z.object({
  rol: z.string().min(1, "El rol es requerido"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  consultorio_id: z.string().optional(),
}).refine((data) => {
  // Si no es doctor, el consultorio es requerido
  if (data.rol && data.rol !== ROLES.DOCTOR) {
    return data.consultorio_id && data.consultorio_id.length > 0;
  }
  return true;
}, {
  message: "El consultorio es requerido para este rol",
  path: ["consultorio_id"],
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

// Roles disponibles
const roles = [
  { value: ROLES.DOCTOR, label: "Doctor" },
  { value: ROLES.SECRETARIA, label: "Secretaria" },
  { value: ROLES.ENFERMERA, label: "Enfermera" },
  { value: ROLES.ADMINISTRADOR, label: "Administrador" },
];

// Tipos para consultorios
interface Consultorio {
  id: string;
  nombre: string;
  direccion?: string;
  organizacion_id: string;
}

export default function UsuariosYConsultorios() {
  // Estados principales
  const [usuarios, setUsuarios] = useState<UsuarioPermisos[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estados de modales
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [permisosOpen, setPermisosOpen] = useState(false);
  
  // Estados de selección
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioPermisos | null>(null);
  const [permisosUsuario, setPermisosUsuario] = useState({
    puede_editar_cobros: false,
    puede_eliminar_cobros: false,
    puede_ver_historial: false,
    puede_gestionar_usuarios: false,
    puede_gestionar_calendario: false,
    puede_gestionar_inventario: false,
    puede_ver_facturas: false,
    puede_crear_facturas: false,
  });

  // Hook de permisos
  const { permisos, esDoctor, loading: permisosLoading } = usePermisos();

  // Formulario con react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    mode: "onChange",
  });

  // Observar cambios en el rol para validación dinámica
  const selectedRol = watch("rol");

  // Cargar datos iniciales
  useEffect(() => {
    if (!permisosLoading) {
      loadUsuarios();
      loadConsultorios();
    }
  }, [permisosLoading]);

  // Cargar consultorios cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadConsultorios();
    }
  }, [open]);

  // Sincronizar estado de permisos cuando cambie el usuario seleccionado o se abra el modal
  useEffect(() => {
    if (selectedUsuario && permisosOpen) {
      // Buscar el usuario más reciente en la lista para obtener datos actualizados
      const usuarioActualizado = usuarios.find(u => u.id === selectedUsuario.id);
      if (usuarioActualizado) {
        console.log('🔍 [DEBUG] Sincronizando permisos para:', usuarioActualizado.nombre);
        console.log('🔍 [DEBUG] Valores de BD:', {
          puede_editar_cobros: usuarioActualizado.puede_editar_cobros,
          puede_eliminar_cobros: usuarioActualizado.puede_eliminar_cobros,
          puede_ver_historial: usuarioActualizado.puede_ver_historial,
          puede_gestionar_usuarios: usuarioActualizado.puede_gestionar_usuarios,
          puede_gestionar_calendario: usuarioActualizado.puede_gestionar_calendario,
          puede_gestionar_inventario: usuarioActualizado.puede_gestionar_inventario,
          puede_ver_facturas: usuarioActualizado.puede_ver_facturas,
          puede_crear_facturas: usuarioActualizado.puede_crear_facturas,
        });
        
        setPermisosUsuario({
          puede_editar_cobros: Boolean(usuarioActualizado.puede_editar_cobros),
          puede_eliminar_cobros: Boolean(usuarioActualizado.puede_eliminar_cobros),
          puede_ver_historial: Boolean(usuarioActualizado.puede_ver_historial),
          puede_gestionar_usuarios: Boolean(usuarioActualizado.puede_gestionar_usuarios),
          puede_gestionar_calendario: Boolean(usuarioActualizado.puede_gestionar_calendario),
          puede_gestionar_inventario: Boolean(usuarioActualizado.puede_gestionar_inventario),
          puede_ver_facturas: Boolean(usuarioActualizado.puede_ver_facturas),
          puede_crear_facturas: Boolean(usuarioActualizado.puede_crear_facturas),
        });
        
        console.log('🔍 [DEBUG] Estado sincronizado:', {
          puede_editar_cobros: Boolean(usuarioActualizado.puede_editar_cobros),
          puede_eliminar_cobros: Boolean(usuarioActualizado.puede_eliminar_cobros),
          puede_ver_historial: Boolean(usuarioActualizado.puede_ver_historial),
          puede_gestionar_usuarios: Boolean(usuarioActualizado.puede_gestionar_usuarios),
          puede_gestionar_calendario: Boolean(usuarioActualizado.puede_gestionar_calendario),
          puede_gestionar_inventario: Boolean(usuarioActualizado.puede_gestionar_inventario),
          puede_ver_facturas: Boolean(usuarioActualizado.puede_ver_facturas),
          puede_crear_facturas: Boolean(usuarioActualizado.puede_crear_facturas),
        });
      }
    }
  }, [selectedUsuario, permisosOpen, usuarios]);

  // Función robusta para cargar consultorios
  const loadConsultorios = async () => {
    try {
      console.log('🔄 Cargando consultorios...');
      const response = await api.get('/consultorios');
      console.log('✅ Consultorios cargados:', response.data);
      setConsultorios(response.data);
    } catch (error: any) {
      console.error('❌ Error cargando consultorios:', error);
      setConsultorios([]);
    }
  };

  // Función robusta para cargar usuarios
  const loadUsuarios = async () => {
    try {
      console.log('🔄 Cargando usuarios...');
      const data = await obtenerUsuariosConsultorio();
      console.log('✅ Usuarios cargados:', data);
      setUsuarios(data);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
    }
  };

  // Función para obtener consultorios disponibles según el rol
  const getConsultoriosDisponibles = (rol: string): Consultorio[] => {
    if (!rol) return [];
    
    if (rol === ROLES.DOCTOR) {
      // Para doctores, mostrar todos los consultorios
      return consultorios;
    } else {
      // Para otros roles, mostrar todos los consultorios disponibles
      return consultorios;
    }
  };

  // Función para manejar cambios en el rol
  const handleRolChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRol = e.target.value;
    setValue("rol", newRol);
    
    // Si es doctor, limpiar el consultorio
    if (newRol === ROLES.DOCTOR) {
      setValue("consultorio_id", "");
    }
    
    // Validar el formulario después del cambio
    await trigger("consultorio_id");
  };

  // Función para crear usuario
  const onSubmit = async (data: UsuarioForm) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      console.log('🔄 Creando usuario con datos:', data);
      
      // Preparar los datos para el backend
      const userData = {
        ...data,
        // Si es doctor, no enviar consultorio_id (acceso a todos)
        // Si no es doctor, enviar el consultorio_id seleccionado
        consultorio_id: data.rol === ROLES.DOCTOR ? undefined : data.consultorio_id
      };
      
      await crearUsuarioPermisos(userData);
      setSuccessMsg("Usuario registrado correctamente");
      setOpen(false);
      reset();
      await loadUsuarios();
    } catch (e: any) {
      console.error('❌ Error creando usuario:', e);
      setErrorMsg(e?.response?.data?.error || "Error al registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  // Función para editar usuario
  const handleEditUsuario = (usuario: UsuarioPermisos) => {
    setSelectedUsuario(usuario);
    setValue('nombre', usuario.nombre);
    setValue('apellido', usuario.apellido);
    setValue('email', usuario.email);
    setValue('telefono', usuario.telefono);
    setValue('rol', usuario.rol);
    setEditOpen(true);
  };

  // Función para guardar edición
  const handleEditSubmit = async (data: UsuarioForm) => {
    if (!selectedUsuario) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      await actualizarUsuario(selectedUsuario.id, data);
      setSuccessMsg("Usuario actualizado correctamente");
      setEditOpen(false);
      setSelectedUsuario(null);
      reset();
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar usuario
  const handleDeleteUsuario = async (usuarioId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    
    try {
      await eliminarUsuario(usuarioId);
      setSuccessMsg("Usuario eliminado correctamente");
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al eliminar el usuario");
    }
  };

  // Función para manejar permisos
  const handlePermisosUsuario = (usuario: UsuarioPermisos) => {
    setSelectedUsuario(usuario);
    setPermisosUsuario({
      puede_editar_cobros: usuario.puede_editar_cobros,
      puede_eliminar_cobros: usuario.puede_eliminar_cobros,
      puede_ver_historial: usuario.puede_ver_historial,
      puede_gestionar_usuarios: usuario.puede_gestionar_usuarios,
      puede_gestionar_calendario: usuario.puede_gestionar_calendario,
      puede_gestionar_inventario: usuario.puede_gestionar_inventario,
      puede_ver_facturas: usuario.puede_ver_facturas,
      puede_crear_facturas: usuario.puede_crear_facturas,
    });
    setPermisosOpen(true);
  };

  // Función para guardar permisos
  const handlePermisosSubmit = async () => {
    if (!selectedUsuario) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      await actualizarPermisosUsuario(selectedUsuario.id, permisosUsuario);
      setSuccessMsg("Permisos actualizados correctamente");
      setPermisosOpen(false);
      setSelectedUsuario(null);
      setPermisosUsuario({
        puede_editar_cobros: false,
        puede_eliminar_cobros: false,
        puede_ver_historial: false,
        puede_gestionar_usuarios: false,
        puede_gestionar_calendario: false,
        puede_gestionar_inventario: false,
        puede_ver_facturas: false,
        puede_crear_facturas: false,
      });
      await loadUsuarios();
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "Error al actualizar permisos");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener color del rol
  const getRolColor = (rol: string) => {
    switch (rol) {
      case ROLES.DOCTOR:
        return "bg-blue-100 text-blue-800";
      case ROLES.SECRETARIA:
        return "bg-green-100 text-green-800";
      case ROLES.ENFERMERA:
        return "bg-purple-100 text-purple-800";
      case ROLES.ADMINISTRADOR:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener etiqueta del rol
  const getRolLabel = (rol: string) => {
    switch (rol) {
      case ROLES.DOCTOR:
        return "Doctor";
      case ROLES.SECRETARIA:
        return "Secretaria";
      case ROLES.ENFERMERA:
        return "Enfermera";
      case ROLES.ADMINISTRADOR:
        return "Administrador";
      default:
        return rol;
    }
  };

  // Renderizado condicional basado en permisos
  if (permisosLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario es doctor o si hay un error en los permisos
  // Si hay error en permisos pero el usuario está logueado, permitir acceso temporal
  const token = localStorage.getItem('token');
  const shouldAllowAccess = esDoctor || (token && !permisosLoading);
  
  if (!shouldAllowAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          {!token && (
            <p className="text-sm text-red-500 mt-2">Por favor, inicia sesión nuevamente.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Mensajes de éxito y error */}
      {successMsg && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Consultorio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Rol</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Permisos</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{usuario.nombre} {usuario.apellido}</div>
                        <div className="text-sm text-gray-500">{usuario.telefono}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getRolColor(usuario.rol)}>
                        {getRolLabel(usuario.rol)}
                      </Badge>
                    </td>
                    <td className="p-2">{usuario.email}</td>
                    <td className="p-2">
                      {usuario.rol === 'DOCTOR' ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          🔓 Acceso Total
                        </Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {usuario.puede_editar_cobros && <Badge variant="secondary" className="text-xs">💰 Editar</Badge>}
                          {usuario.puede_eliminar_cobros && <Badge variant="secondary" className="text-xs">🗑️ Eliminar</Badge>}
                          {usuario.puede_ver_historial && <Badge variant="secondary" className="text-xs">📊 Historial</Badge>}
                          {usuario.puede_gestionar_usuarios && <Badge variant="secondary" className="text-xs">👥 Usuarios</Badge>}
                          {usuario.puede_gestionar_calendario && <Badge variant="secondary" className="text-xs">📅 Calendario</Badge>}
                          {usuario.puede_gestionar_inventario && <Badge variant="secondary" className="text-xs">📦 Inventario</Badge>}
                          {usuario.puede_ver_facturas && <Badge variant="secondary" className="text-xs">📄 Ver Facturas</Badge>}
                          {usuario.puede_crear_facturas && <Badge variant="secondary" className="text-xs">✨ Crear Facturas</Badge>}
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUsuario(usuario)}
                          className="text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {usuario.rol !== 'DOCTOR' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePermisosUsuario(usuario)}
                            className="text-white"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUsuario(usuario.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear usuario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  {...register("nombre")}
                  placeholder="Nombre del usuario"
                  className="text-white"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  {...register("apellido")}
                  placeholder="Apellido del usuario"
                  className="text-white"
                />
                {errors.apellido && (
                  <p className="text-red-500 text-sm">{errors.apellido.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@ejemplo.com"
                className="text-white"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="Teléfono"
                className="text-white"
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Mínimo 6 caracteres"
                className="text-white"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rol">Rol *</Label>
              <select
                id="rol"
                {...register("rol")}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                onChange={handleRolChange}
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <p className="text-red-500 text-sm">{errors.rol.message}</p>
              )}
              
              {/* Mensaje informativo para doctores */}
              {selectedRol === ROLES.DOCTOR && (
                <p className="text-blue-600 text-sm mt-1">
                  ℹ️ Los doctores tienen acceso a todos los consultorios automáticamente
                </p>
              )}
            </div>
            
            {/* Campo de consultorio - solo mostrar si no es doctor */}
            {selectedRol && selectedRol !== ROLES.DOCTOR && (
              <div>
                <Label htmlFor="consultorio_id">Consultorio *</Label>
                <select
                  id="consultorio_id"
                  {...register("consultorio_id")}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                  required
                >
                  <option value="">Selecciona un consultorio</option>
                  {getConsultoriosDisponibles(selectedRol).length > 0 ? (
                    getConsultoriosDisponibles(selectedRol).map((consultorio) => (
                      <option key={consultorio.id} value={consultorio.id}>
                        {consultorio.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay consultorios disponibles</option>
                  )}
                </select>
                {errors.consultorio_id && (
                  <p className="text-red-500 text-sm">{errors.consultorio_id.message}</p>
                )}
                <p className="text-gray-600 text-sm mt-1">
                  ℹ️ Selecciona el consultorio donde trabajará este usuario ({getConsultoriosDisponibles(selectedRol).length} consultorios disponibles)
                </p>
                {getConsultoriosDisponibles(selectedRol).length === 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    ⚠️ No hay consultorios disponibles. Contacta al administrador.
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar usuario */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  {...register("nombre")}
                  placeholder="Nombre del usuario"
                  className="text-white"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  {...register("apellido")}
                  placeholder="Apellido del usuario"
                  className="text-white"
                />
                {errors.apellido && (
                  <p className="text-red-500 text-sm">{errors.apellido.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                {...register("email")}
                placeholder="email@ejemplo.com"
                className="text-white"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-telefono">Teléfono *</Label>
              <Input
                id="edit-telefono"
                {...register("telefono")}
                placeholder="Teléfono"
                className="text-white"
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm">{errors.telefono.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-rol">Rol *</Label>
              <select
                id="edit-rol"
                {...register("rol")}
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <p className="text-red-500 text-sm">{errors.rol.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para permisos */}
      <Dialog open={permisosOpen} onOpenChange={setPermisosOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Permisos de Usuario</DialogTitle>
          </DialogHeader>
          {selectedUsuario && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold">{selectedUsuario.nombre} {selectedUsuario.apellido}</h3>
                <p className="text-sm text-gray-600">{selectedUsuario.email}</p>
                <Badge className={getRolColor(selectedUsuario.rol)}>
                  {getRolLabel(selectedUsuario.rol)}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_editar_cobros">💰 Puede editar cobros</Label>
                  <Switch
                    id="puede_editar_cobros"
                    checked={permisosUsuario.puede_editar_cobros}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_editar_cobros: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_eliminar_cobros">🗑️ Puede eliminar cobros</Label>
                  <Switch
                    id="puede_eliminar_cobros"
                    checked={permisosUsuario.puede_eliminar_cobros}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_eliminar_cobros: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_ver_historial">📊 Puede ver historial</Label>
                  <Switch
                    id="puede_ver_historial"
                    checked={permisosUsuario.puede_ver_historial}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_ver_historial: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_gestionar_usuarios">👥 Puede gestionar usuarios</Label>
                  <Switch
                    id="puede_gestionar_usuarios"
                    checked={permisosUsuario.puede_gestionar_usuarios}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_gestionar_usuarios: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_gestionar_calendario">📅 Puede gestionar calendario</Label>
                  <Switch
                    id="puede_gestionar_calendario"
                    checked={permisosUsuario.puede_gestionar_calendario}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_gestionar_calendario: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_gestionar_inventario">📦 Puede gestionar inventario</Label>
                  <Switch
                    id="puede_gestionar_inventario"
                    checked={permisosUsuario.puede_gestionar_inventario}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_gestionar_inventario: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_ver_facturas">📄 Puede ver facturas</Label>
                  <Switch
                    id="puede_ver_facturas"
                    checked={permisosUsuario.puede_ver_facturas}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_ver_facturas: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="puede_crear_facturas">✨ Puede crear facturas</Label>
                  <Switch
                    id="puede_crear_facturas"
                    checked={permisosUsuario.puede_crear_facturas}
                    onCheckedChange={(checked) =>
                      setPermisosUsuario(prev => ({ ...prev, puede_crear_facturas: checked }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handlePermisosSubmit} disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar Permisos"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPermisosOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Componente de consultorios */}
      <div className="mt-8">
        <Consultorios />
      </div>
    </div>
  );
} 