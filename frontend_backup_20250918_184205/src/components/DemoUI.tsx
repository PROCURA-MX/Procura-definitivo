import React, { useState } from 'react';
import { AdvancedTable } from './ui/AdvancedTable';
import { AdvancedFilters } from './ui/AdvancedFilters';
import { 
  DonutChart, 
  HorizontalBarChart, 
  ProgressIndicator, 
  GradientAreaChart, 
  MetricCard 
} from './ui/AdvancedCharts';
import { 
  Input, 
  Select, 
  Textarea, 
  Checkbox 
} from './ui/AdvancedForm';
import { FaMoneyBillWave, FaUsers, FaChartLine, FaCheckCircle } from 'react-icons/fa';

// Datos de ejemplo para las tablas
const sampleData = [
  { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '555-0101', estado: 'Activo' },
  { id: 2, nombre: 'María García', email: 'maria@example.com', telefono: '555-0102', estado: 'Inactivo' },
  { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', telefono: '555-0103', estado: 'Activo' },
  { id: 4, nombre: 'Ana Martínez', email: 'ana@example.com', telefono: '555-0104', estado: 'Activo' },
  { id: 5, nombre: 'Luis Rodríguez', email: 'luis@example.com', telefono: '555-0105', estado: 'Inactivo' },
];

// Datos para gráficos
const chartData = [
  { name: 'Efectivo', value: 45, color: '#10B981' },
  { name: 'Tarjeta', value: 30, color: '#3B82F6' },
  { name: 'Transferencia', value: 15, color: '#F59E0B' },
  { name: 'Otros', value: 10, color: '#EF4444' },
];

const horizontalData = [
  { name: 'Producto A', value: 120 },
  { name: 'Producto B', value: 85 },
  { name: 'Producto C', value: 65 },
  { name: 'Producto D', value: 45 },
  { name: 'Producto E', value: 30 },
];

const areaData = [
  { name: 'Ene', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Abr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

export default function DemoUI() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    categoria: '',
    descripcion: '',
    acepto: false
  });

  const [filters, setFilters] = useState({});

  // Configuración de columnas para la tabla
  const columns = [
    { key: 'id' as const, label: 'ID', sortable: true, width: 'w-16' },
    { key: 'nombre' as const, label: 'Nombre', sortable: true },
    { key: 'email' as const, label: 'Email', sortable: true },
    { key: 'telefono' as const, label: 'Teléfono', sortable: false },
    { 
      key: 'estado' as const, 
      label: 'Estado', 
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  // Configuración de filtros
  const filterConfig = [
    { key: 'estado', label: 'Estado', type: 'select' as const, options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' }
    ]},
    { key: 'fecha', label: 'Fecha', type: 'date' as const },
    { key: 'busqueda', label: 'Buscar', type: 'text' as const, placeholder: 'Buscar por nombre...' }
  ];

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Componentes de UI Mejorados
        </h1>
        <p className="text-xl text-gray-600">
          Demostración de los nuevos componentes integrados
        </p>
      </div>

      {/* Métricas */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tarjetas de Métricas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Ingresos"
            value="$125,000"
            subtitle="Este mes"
            trend={{ value: 12.5, isPositive: true }}
            icon={<FaMoneyBillWave />}
            color="#10B981"
          />
          <MetricCard
            title="Usuarios Activos"
            value="1,234"
            subtitle="En línea"
            trend={{ value: 8.2, isPositive: true }}
            icon={<FaUsers />}
            color="#3B82F6"
          />
          <MetricCard
            title="Tasa de Conversión"
            value="24.5%"
            subtitle="Promedio"
            trend={{ value: 2.1, isPositive: false }}
            icon={<FaChartLine />}
            color="#F59E0B"
          />
          <MetricCard
            title="Tareas Completadas"
            value="89"
            subtitle="De 100"
            icon={<FaCheckCircle />}
            color="#8B5CF6"
          />
        </div>
      </section>

      {/* Indicadores de Progreso */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Indicadores de Progreso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProgressIndicator
            title="Objetivo de Ventas"
            value={75}
            max={100}
            subtitle="75% completado"
            color="#10B981"
          />
          <ProgressIndicator
            title="Proyecto Actual"
            value={45}
            max={60}
            subtitle="45 de 60 tareas"
            color="#3B82F6"
          />
          <ProgressIndicator
            title="Presupuesto Utilizado"
            value={85}
            max={100}
            subtitle="$85,000 de $100,000"
            color="#F59E0B"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gráficos Avanzados</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DonutChart
            title="Distribución de Pagos"
            data={chartData}
            height={300}
          />
          <HorizontalBarChart
            title="Productos Más Vendidos"
            data={horizontalData}
            height={300}
          />
        </div>
        <div className="mt-8">
          <GradientAreaChart
            title="Tendencias de Ventas"
            data={areaData}
            height={300}
            color="#8B5CF6"
          />
        </div>
      </section>

      {/* Tabla Avanzada */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tabla con Filtros Avanzados</h2>
        <AdvancedFilters
          filters={filterConfig}
          onFiltersChange={setFilters}
          className="mb-6"
        />
        <AdvancedTable
          data={sampleData}
          columns={columns}
          pageSize={5}
          searchable={true}
          searchFields={['nombre', 'email']}
          onRowClick={(row) => console.log('Fila clickeada:', row)}
        />
      </section>

      {/* Formularios Avanzados */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Formularios con Validación</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre Completo"
              name="nombre"
              value={formData.nombre}
              onChange={(value) => setFormData({...formData, nombre: value})}
              placeholder="Ingresa tu nombre"
              required={true}
              minLength={2}
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({...formData, email: value})}
              placeholder="tu@email.com"
              required={true}
            />
            
            <Input
              label="Teléfono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(value) => setFormData({...formData, telefono: value})}
              placeholder="(555) 123-4567"
              mask="(###) ###-####"
            />
            
            <Select
              label="Categoría"
              name="categoria"
              value={formData.categoria}
              onChange={(value) => setFormData({...formData, categoria: value})}
              options={[
                { value: 'cliente', label: 'Cliente' },
                { value: 'proveedor', label: 'Proveedor' },
                { value: 'empleado', label: 'Empleado' }
              ]}
              searchable={true}
            />
          </div>
          
          <div className="mt-6">
            <Textarea
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={(value) => setFormData({...formData, descripcion: value})}
              placeholder="Describe aquí..."
              maxLength={500}
              rows={4}
            />
          </div>
          
          <div className="mt-6">
            <Checkbox
              label="Acepto los términos y condiciones"
              name="acepto"
              checked={formData.acepto}
              onChange={(checked) => setFormData({...formData, acepto: checked})}
            />
          </div>
          
          <div className="mt-8 flex justify-end">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Guardar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
