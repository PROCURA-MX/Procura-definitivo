import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-green-600">Página de inicio</h2>
      <p>¡Esta es la página principal!</p>
      <Button className="mt-4">¡Soy un botón shadcn/ui!</Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/dashboard"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
          <p className="text-gray-600">Métricas y estadísticas</p>
        </Link>
        <Link
          to="/cobros"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Cobros</h3>
          <p className="text-gray-600">Gestionar cobros y facturación</p>
        </Link>
        <Link
          to="/conceptos"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Conceptos</h3>
          <p className="text-gray-600">Administrar servicios y precios</p>
        </Link>
        <Link
          to="/pacientes"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Pacientes</h3>
          <p className="text-gray-600">Gestionar información de pacientes</p>
        </Link>
        <Link
          to="/usuarios"
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">Usuarios</h3>
          <p className="text-gray-600">Administrar usuarios del sistema</p>
        </Link>
      </div>
    </div>
  );
}