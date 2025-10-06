import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import { usePermisos } from "@/hooks/usePermisos";
import { 
  LayoutDashboard, 
  CreditCard, 
  Tags, 
  Users, 
  User, 
  Menu, 
  X,
  Calendar as CalendarIcon,
  Package,
  History,
  FileText
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const navigation = [
  { name: "Cobros", href: "/dashboard", icon: LayoutDashboard, modulo: "cobros" },
  { name: "Pacientes", href: "/pacientes", icon: Users, modulo: "pacientes" }, // Sin restricción
  { name: "Usuarios", href: "/usuarios", icon: User, modulo: "usuarios" },
  { name: "Calendario", href: "/calendario", icon: CalendarIcon, modulo: "citas" },
  { name: "Inventario", href: "/inventario", icon: Package, modulo: "inventario" },
  { name: "Facturación", href: "/facturacion", icon: FileText, modulo: "facturacion" },
  { name: "Historial", href: "/historial", icon: History, modulo: "historial" },
];

export default function Layout({ children, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { modulosDisponibles, loading, error } = usePermisos();

  console.log('🔍 DEBUG - Layout renderizado');
  console.log('🔍 DEBUG - Ruta actual en Layout:', location.pathname);
  console.log('🔍 DEBUG - Módulos disponibles:', modulosDisponibles);

  // 🆕 FILTRAR navegación según módulos disponibles
  const navigationVisible = navigation.filter(item => {
    // Si no tiene restricción (como pacientes), siempre visible
    if (!item.modulo) return true;
    
    // ✅ VALIDACIÓN: Asegurar que modulosDisponibles sea un array
    if (!Array.isArray(modulosDisponibles)) {
      console.log('⚠️ modulosDisponibles no es un array:', modulosDisponibles);
      return false; // Si no es array, no mostrar nada
    }
    
    // Si tiene restricción, verificar si está en modulosDisponibles
    return modulosDisponibles.includes(item.modulo);
  });

  console.log('🔍 DEBUG - Navegación visible:', navigationVisible.map(item => item.name));

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className="sidebar-bg flex flex-col h-screen fixed left-0 top-0 bottom-0 text-white w-[320px] min-w-[280px] max-w-[360px] shadow-lg z-40"
      >
        <div className="flex flex-col items-center py-10 px-6 border-b border-[#223052]">
          <Logo size="lg" />
        </div>
        <nav className="flex-1 flex flex-col gap-3 mt-10">
          {navigationVisible.map((item) => {
            const active = location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-5 px-8 py-5 rounded-xl transition-colors text-xl font-bold
                  ${active ? 'bg-[#223052] border-l-4 border-white text-white' : 'hover:bg-[#4285f2] hover:text-white hover:shadow-md text-gray-200'}
                `}
              >
                <item.icon className="w-9 h-9 mr-2" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Logout button at the bottom */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto mb-8 mx-8 py-3 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow transition-colors"
          >
            Cerrar sesión
          </button>
        )}
      </aside>
      {/* Main content */}
      <main className="flex-1 min-h-screen ml-[320px] bg-white p-8 overflow-y-auto transition-colors duration-300 flex justify-center">
        {children}
      </main>
    </div>
  );
} 