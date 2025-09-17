import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import Usuarios from "./pages/Usuarios";
import DashboardPage from "./pages/DashboardPage";
import About from "./pages/About";
import Calendario from "./pages/Calendario";
import Login from './pages/Login';
import { useState, useEffect } from 'react';
import { PermisosProvider } from './hooks/usePermisos';
import { ConsultorioProvider } from './contexts/ConsultorioContext';
// Nuevos imports de inventario
import InventarioDashboard from "./pages/inventario/Dashboard";
import InventarioEntrada from "./pages/inventario/Entrada";
import InventarioSalida from "./pages/inventario/Salida";
import InventarioUso from "./pages/inventario/Uso";
import DisponibilidadBloqueos from './pages/DisponibilidadBloqueos';
import Historial from './components/Historial';
import Facturacion from './pages/Facturacion';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar si el token es válido
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          setIsLoggedIn(true);
        } else {
          // Token expirado
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Token inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    // Limpiar fechas persistentes al cerrar sesión
    localStorage.removeItem('inventory_date_filter_from');
    localStorage.removeItem('inventory_date_filter_to');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  // Mostrar loading mientras verifica el token
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#2d3748]">
      <div className="text-white text-xl">Cargando...</div>
    </div>;
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <BrowserRouter>
      <PermisosProvider>
        <ConsultorioProvider>
          <Layout onLogout={handleLogout}>
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rutas protegidas por módulos */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredModulo="cobros">
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/pacientes" element={<Pacientes />} /> {/* Sin restricción */}
            
            <Route path="/usuarios" element={
              <ProtectedRoute requiredModulo="usuarios">
                <Usuarios />
              </ProtectedRoute>
            } />
            
            <Route path="/calendario" element={
              <ProtectedRoute requiredModulo="citas">
                <Calendario />
              </ProtectedRoute>
            } />
            
            <Route path="/historial" element={
              <ProtectedRoute requiredModulo="historial">
                <Historial />
              </ProtectedRoute>
            } />
            
            {/* Rutas de inventario protegidas */}
            <Route path="/inventario" element={
              <ProtectedRoute requiredModulo="inventario">
                <InventarioDashboard />
              </ProtectedRoute>
            } />
            <Route path="/inventario/dashboard" element={
              <ProtectedRoute requiredModulo="inventario">
                <InventarioDashboard />
              </ProtectedRoute>
            } />
            <Route path="/inventario/entrada" element={
              <ProtectedRoute requiredModulo="inventario">
                <InventarioEntrada />
              </ProtectedRoute>
            } />
            <Route path="/inventario/salida" element={
              <ProtectedRoute requiredModulo="inventario">
                <InventarioSalida />
              </ProtectedRoute>
            } />
            <Route path="/inventario/uso" element={
              <ProtectedRoute requiredModulo="inventario">
                <InventarioUso />
              </ProtectedRoute>
            } />
            
            <Route path="/facturacion" element={
              <ProtectedRoute requiredModulo="facturacion">
                <Facturacion />
              </ProtectedRoute>
            } />
            
            <Route path="/about" element={<About />} />
            <Route path="/disponibilidad-bloqueos" element={<DisponibilidadBloqueos />} />

            </Routes>
          </Layout>
        </ConsultorioProvider>
      </PermisosProvider>
    </BrowserRouter>
  );
}

export default App;
