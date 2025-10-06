import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermisos } from '@/hooks/usePermisos';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModulo?: string;
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredModulo, 
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const { modulosDisponibles, loading, error } = usePermisos();
  
  console.log('🔍 [ProtectedRoute] Verificando acceso:', {
    requiredModulo,
    modulosDisponibles,
    loading,
    error,
    hasAccess: modulosDisponibles.includes(requiredModulo || '')
  });

  // ✅ SOLUCIÓN ROBUSTA: Si hay error, NO redirigir automáticamente
  if (error) {
    console.log('⚠️ [ProtectedRoute] Error cargando permisos:', error);
    // En caso de error, permitir acceso temporalmente para evitar loops
    return <>{children}</>;
  }

  // Mostrar loading mientras se cargan los permisos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no se requiere módulo específico, permitir acceso
  if (!requiredModulo) {
    return <>{children}</>;
  }

  // ✅ SOLUCIÓN ESCALABLE: Verificar si el usuario tiene acceso al módulo requerido
  const hasAccess = Array.isArray(modulosDisponibles) && modulosDisponibles.includes(requiredModulo);

  if (!hasAccess) {
    console.log(`🚫 [ProtectedRoute] Acceso denegado al módulo: ${requiredModulo}`);
    console.log(`📋 [ProtectedRoute] Módulos disponibles:`, modulosDisponibles);
    console.log(`📋 [ProtectedRoute] Tipo de modulosDisponibles:`, typeof modulosDisponibles);
    console.log(`📋 [ProtectedRoute] Es array:`, Array.isArray(modulosDisponibles));
    
    // ✅ SOLUCIÓN DINÁMICA: Redirigir solo si realmente no tiene acceso
    return <Navigate to={fallbackPath} replace />;
  }

  console.log(`✅ [ProtectedRoute] Acceso permitido al módulo: ${requiredModulo}`);
  return <>{children}</>;
}

