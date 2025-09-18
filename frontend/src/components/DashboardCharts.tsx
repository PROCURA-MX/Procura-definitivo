import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface DashboardChartsProps {
  cobros: any[];
  metodoPagoMontos: Record<string, number>;
  conceptosStats: Record<string, number>;
  periodoFiltro?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function DashboardCharts({ cobros, metodoPagoMontos, conceptosStats, periodoFiltro = 'mes' }: DashboardChartsProps) {
  // Preparar datos para gráfico de tendencias según el período
  const getTendenciasData = () => {
    const hoy = new Date();
    let dias = 7;
    let incremento = 1;
    
    switch (periodoFiltro) {
      case 'hoy':
        dias = 24;
        incremento = 1; // Por hora
        break;
      case 'semana':
        dias = 7;
        incremento = 1; // Por día
        break;
      case 'mes':
        dias = 30;
        incremento = 1; // Por día
        break;
      case 'año':
        dias = 12;
        incremento = 30; // Por mes
        break;
      default:
        dias = 7;
        incremento = 1;
    }
    
    const tendencias = [];
    for (let i = dias - 1; i >= 0; i--) {
      const date = new Date();
      if (periodoFiltro === 'hoy') {
        date.setHours(date.getHours() - i);
        const horaStr = date.toISOString().slice(0, 13);
        const cobrosDeLaHora = cobros.filter(c => c.fecha_cobro?.slice(0, 13) === horaStr);
        const ingresosDeLaHora = cobrosDeLaHora.reduce((sum, c) => sum + (c.monto_total || 0), 0);
        
        tendencias.push({
          fecha: date.toLocaleTimeString('es-ES', { hour: '2-digit' }),
          cobros: cobrosDeLaHora.length,
          ingresos: ingresosDeLaHora
        });
      } else {
        date.setDate(date.getDate() - (i * incremento));
        const dateStr = date.toISOString().slice(0, 10);
        const cobrosDelDia = cobros.filter(c => c.fecha_cobro?.slice(0, 10) === dateStr);
        const ingresosDelDia = cobrosDelDia.reduce((sum, c) => sum + (c.monto_total || 0), 0);
        
        let formatoFecha = 'short';
        if (periodoFiltro === 'año') {
          formatoFecha = 'short';
        }
        
        tendencias.push({
          fecha: date.toLocaleDateString('es-ES', { 
            weekday: periodoFiltro === 'semana' ? 'short' : undefined,
            day: 'numeric',
            month: periodoFiltro === 'año' ? 'short' : undefined
          }),
          cobros: cobrosDelDia.length,
          ingresos: ingresosDelDia
        });
      }
    }
    return tendencias;
  };

  // Preparar datos para gráfico de métodos de pago
  const getMetodosPagoData = () => {
    return Object.entries(metodoPagoMontos).map(([metodo, monto]) => ({
      name: metodo.replace(/_/g, ' '),
      value: monto,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  };

  // Preparar datos para gráfico de conceptos
  const getConceptosData = () => {
    return Object.entries(conceptosStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([concepto, cantidad]) => ({
        name: concepto.length > 20 ? concepto.substring(0, 20) + '...' : concepto,
        fullName: concepto, // Guardar el nombre completo para el tooltip
        value: cantidad,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
  };

  // Preparar datos para gráfico de ingresos mensuales de los últimos 6 meses
  const getIngresosMensualesData = () => {
    const meses = [];
    const hoy = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesStr = fecha.toISOString().slice(0, 7); // YYYY-MM
      
      const cobrosDelMes = cobros.filter(c => {
        if (!c.fecha_cobro) return false;
        return c.fecha_cobro.slice(0, 7) === mesStr;
      });
      
      const ingresosDelMes = cobrosDelMes.reduce((sum, c) => sum + (c.monto_total || 0), 0);
      
      meses.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        ingresos: ingresosDelMes
      });
    }
    
    return meses;
  };

  const tendenciasData = getTendenciasData();
  const metodosPagoData = getMetodosPagoData();
  const conceptosData = getConceptosData();
  const ingresosMensualesData = getIngresosMensualesData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'ingresos' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Gráfico de Tendencias */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Tendencias de Cobros e Ingresos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={tendenciasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cobros"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
              name="Cobros"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="ingresos"
              stackId="2"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
              name="Ingresos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Métodos de Pago */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metodosPagoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((Number(percent) || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metodosPagoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Conceptos */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Conceptos Más Populares</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conceptosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [
                  formatCurrency(Number(value)), 
                  props.payload.fullName || props.payload.name
                ]}
                labelFormatter={(label) => `Concepto: ${label}`}
              />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Ingresos Mensuales - Últimos 6 Meses */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingresos Mensuales - Últimos 6 Meses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={ingresosMensualesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.6}
              name="Ingresos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
