import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  console.log('🔍 DEBUG - DashboardPage renderizado');
  console.log('🔍 DEBUG - Ruta actual:', window.location.pathname);
  console.log('🔍 DEBUG - Componente Dashboard importado:', Dashboard);
  
  return (
    <div>
      <Dashboard />
    </div>
  );
} 