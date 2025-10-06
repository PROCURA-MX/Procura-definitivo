'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, AlertTriangle, Pill, FileText, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DialogDatePicker } from '@/components/ui/dialog-date-picker';

// 🏥 INTERFACES PARA EXPEDIENTE DE INMUNOTERAPIA
interface ImmunotherapyLogEntry {
  id: string;
  fechaAplicacion: Date;
  tipoTratamiento: string;
  subtipo: string;
  productId?: string | null; // 🎯 AGREGADO: Campo para trazabilidad del producto
  dosis: number;
  unidades?: number;
  frascos?: string[];
  tipoAlxoid?: string;
  tuvoReaccion?: boolean;
  descripcionReaccion?: string;
  medicamentoReaccion?: any;
  consultorioId?: string;
  consultorioNombre?: string;
  sedeId?: string;
  // 🎯 NUEVOS CAMPOS ENRIQUECIDOS
  aplicadoPor?: string;
  aplicadoPorEmail?: string;
  inventoryUsageId?: string;
  observaciones?: string;
  // 🆕 CAMPOS PARA REACCIONES Y ALERGENOS
  alergenos?: string[];
  reaccion?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImmunotherapyRecord {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteApellido: string;
  fechaInicio: Date;
  fechaInicioOriginal: Date;
  ultimaEdicion: Date;
  editadoPor: string;
  log: ImmunotherapyLogEntry[];
  // 🆕 LISTA DE ALERGENOS DEL PACIENTE
  alergenos?: string[];
}

interface ImmunotherapyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
  organizacionId: string;
}

// 🏥 COMPONENTE PRINCIPAL DEL EXPEDIENTE
export function ImmunotherapyRecordModal({
  isOpen,
  onClose,
  pacienteId,
  organizacionId
}: ImmunotherapyRecordModalProps) {
  const [record, setRecord] = useState<ImmunotherapyRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 🎯 FUNCIÓN PARA FORMATEAR FECHAS DE FORMA SEGURA
  const formatDateSafely = (dateValue: any): string => {
    if (!dateValue) return 'Fecha no disponible';
    
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ [ImmunotherapyRecordModal] Fecha inválida: ${dateValue}`);
        return 'Fecha inválida';
      }
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error(`❌ [ImmunotherapyRecordModal] Error formateando fecha: ${dateValue}`, error);
      return 'Error en fecha';
    }
  };

  // 🎯 CARGAR EXPEDIENTE
  useEffect(() => {
    if (isOpen && pacienteId && organizacionId) {
      loadRecord();
    }
  }, [isOpen, pacienteId, organizacionId]);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      const response = await fetch(`/api/immunotherapy/record/${pacienteId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ organizacionId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [loadRecord] Respuesta completa del backend:', data);
        setRecord(data.data);
        
        // 🎯 DIAGNÓSTICO ESPECÍFICO DE FRASCOS
        if (data.data && data.data.logEntries && data.data.logEntries.length > 0) {
          console.log('🔍 [loadRecord] Log entries encontrados:', data.data.logEntries.length);
          data.data.logEntries.forEach((entry: any, index: number) => {
            console.log(`🔍 [loadRecord] Entry ${index}:`, {
              subtipo: entry.subtipo,
              frascos: entry.frascos,
              frascosType: typeof entry.frascos,
              frascosLength: entry.frascos ? entry.frascos.length : 'N/A'
            });
          });
        }
      } else {
        console.error('Error al cargar expediente');
      }
    } catch (error) {
      console.error('Error al cargar expediente:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 MANEJAR NUEVO TRATAMIENTO
  const handleNewTreatment = async () => {
    try {
      console.log(`🔍 [ImmunotherapyRecordModal] Iniciando nuevo tratamiento para paciente: ${pacienteId}`);
      
      // Obtener el último tratamiento del paciente
      const response = await fetch(`/api/immunotherapy/last-treatment/${pacienteId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log(`✅ [ImmunotherapyRecordModal] Último tratamiento obtenido:`, data.data);
          
          // Cerrar el modal del expediente
          onClose();
          
          // Navegar al formulario de salida de inventario con datos pre-rellenados
          const searchParams = new URLSearchParams({
            pacienteId: pacienteId,
            prefillData: JSON.stringify(data.data)
          });
          
          // 🚀 REDIRIGIR DIRECTAMENTE AL FORMULARIO PRE-RELLENADO (SALTAR PÁGINA DE SALIDAS)
          window.location.href = `/inventario/salida?${searchParams.toString()}`;
        } else {
          console.log(`ℹ️ [ImmunotherapyRecordModal] No se encontró tratamiento previo`);
          alert('No se encontró ningún tratamiento previo para este paciente. Debe crear un tratamiento desde cero.');
        }
      } else {
        console.error(`❌ [ImmunotherapyRecordModal] Error obteniendo último tratamiento:`, response.statusText);
        alert('Error al obtener el último tratamiento. Intente nuevamente.');
      }
    } catch (error) {
      console.error(`❌ [ImmunotherapyRecordModal] Error en handleNewTreatment:`, error);
      alert('Error al procesar la solicitud. Intente nuevamente.');
    }
  };

  // 🎯 ACTUALIZAR FECHA DE INICIO
  const updateStartDate = async () => {
    if (!record || !newStartDate) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      // 🎯 SOLUCIÓN ROBUSTA: Usar fecha local sin conversión UTC
      const year = newStartDate.getFullYear();
      const month = String(newStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(newStartDate.getDate()).padStart(2, '0');
      const fechaISO = `${year}-${month}-${day}`;

      console.log('🔍 [updateStartDate] Fecha seleccionada:', newStartDate);
      console.log('🔍 [updateStartDate] Fecha formateada:', fechaISO);

      const response = await fetch(`/api/immunotherapy/record/${record.id}/start-date`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nuevaFecha: fechaISO,
          editadoPor: 'current-user-id' // TODO: Obtener del contexto de usuario
        })
      });

      if (response.ok) {
        await loadRecord();
        setEditingStartDate(false);
        setNewStartDate(null);
      }
    } catch (error) {
      console.error('Error al actualizar fecha:', error);
    }
  };

  // 🎯 RENDERIZAR TIPO DE TRATAMIENTO MEJORADO - SOLO EL TIPO, SIN UNIDADES
  const renderTreatmentType = (entry: ImmunotherapyLogEntry) => {
    console.log('🔍 [renderTreatmentType] Entry completo:', entry);
    console.log('🔍 [renderTreatmentType] Subtipo:', entry.subtipo);
    console.log('🔍 [renderTreatmentType] Unidades:', entry.unidades);
    console.log('🔍 [renderTreatmentType] Tipo de tratamiento:', entry.tipoTratamiento);
    
    if (entry.subtipo === 'GLICERINADO_UNIDAD' || entry.subtipo === 'GLICERINADO_POR_UNIDAD') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          Glicerinado por Unidad
        </Badge>
      );
    } else if (entry.subtipo === 'GLICERINADO_EN_FRASCO') {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          Glicerinado en Frasco
        </Badge>
      );
    } else if (entry.subtipo === 'SUBLINGUAL') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-green-200">
          Sublingual
        </Badge>
      );
    } else if (entry.subtipo === 'ALXOID') {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
          Alxoid
        </Badge>
      );
    }

    // 🎯 CASO GENÉRICO PARA CUALQUIER OTRO SUBTIPO
    if (entry.subtipo) {
      return (
        <Badge variant="outline" className="text-gray-700 border-gray-300">
          {entry.subtipo}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-gray-700 border-gray-300">
        Tratamiento
      </Badge>
    );
  };

  // 🎯 RENDERIZAR UNIDADES DINÁMICAMENTE SEGÚN TIPO DE TRATAMIENTO
  const renderUnits = (entry: ImmunotherapyLogEntry) => {
    console.log('🔍 [renderUnits] Entry completo:', entry);
    console.log('🔍 [renderUnits] Subtipo:', entry.subtipo);
    console.log('🔍 [renderUnits] ProductId:', entry.productId);
    console.log('🔍 [renderUnits] Unidades:', entry.unidades);
    console.log('🔍 [renderUnits] Frascos:', entry.frascos);
    console.log('🔍 [renderUnits] Frascos type:', typeof entry.frascos);
    console.log('🔍 [renderUnits] Frascos length:', entry.frascos?.length);
    
    // 🎯 CASO 1: ALXOID - No mostrar unidades, solo "-"
    if (entry.subtipo === 'ALXOID' || entry.subtipo?.startsWith('ALXOID_')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          -
        </span>
      );
    }
    
    // 🎯 CASO 2: SUBLINGUAL - Mostrar número(s) de frasco(s)
    if (entry.subtipo === 'SUBLINGUAL') {
      if (entry.frascos && entry.frascos.length > 0) {
        const frascosText = entry.frascos.length === 1 
          ? `Frasco ${entry.frascos[0]}`
          : `Frascos ${entry.frascos.join(', ')}`;
        
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
            {frascosText}
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            Sin frasco
          </span>
        );
      }
    }
    
    // 🎯 CASO 3: GLICERINADO EN FRASCO - Mostrar número(s) de frasco(s)
    if (entry.subtipo === 'GLICERINADO_EN_FRASCO') {
      if (entry.frascos && entry.frascos.length > 0) {
        const frascosText = entry.frascos.length === 1 
          ? `Frasco ${entry.frascos[0]}`
          : `Frascos ${entry.frascos.join(', ')}`;
        
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            {frascosText}
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            Sin frasco
          </span>
        );
      }
    }
    
    // 🎯 CASO 4: GLICERINADO POR UNIDAD - Mostrar unidades (comportamiento actual)
    if (entry.subtipo === 'GLICERINADO_UNIDAD' || entry.subtipo === 'GLICERINADO_POR_UNIDAD') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {entry.unidades || 0} unidades
        </span>
      );
    }
    
    // 🎯 CASO GENÉRICO: Si no coincide con ningún tipo conocido, mostrar unidades por defecto
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
        {entry.unidades || 0} unidades
      </span>
    );
  };

  // 🆕 RENDERIZAR REACCIONES
  const renderReaction = (entry: ImmunotherapyLogEntry) => {
    if (entry.tuvoReaccion && entry.descripcionReaccion) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 font-medium">
            {entry.descripcionReaccion}
          </span>
        </div>
      );
    }
    return (
      <span className="text-sm text-gray-500">Sin reacciones</span>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Expediente de Inmunoterapia
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!record) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Expediente de Inmunoterapia
            </DialogTitle>
          </DialogHeader>
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Expediente no encontrado</h3>
            <p className="text-muted-foreground">
              Este paciente no tiene un expediente de inmunoterapia registrado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🎯 MANEJAR CIERRE DEL MODAL - NO CERRAR SI EL CALENDARIO ESTÁ ABIERTO
  const handleModalClose = (open: boolean) => {
    if (!open && !isDatePickerOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Expediente de Inmunoterapia
          </DialogTitle>
        </DialogHeader>

        {/* 🎯 SECCIÓN 1: DATOS BÁSICOS */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Datos del Paciente</CardTitle>
              <Button
                onClick={handleNewTreatment}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo Tratamiento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input
                  value={`${record.pacienteNombre} ${record.pacienteApellido}`}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label>Fecha de Inicio</Label>
                <div className="flex items-center gap-2">
                  {editingStartDate ? (
                    <>
                      <div className="relative z-[9999]">
                        <DialogDatePicker
                          selected={newStartDate}
                          onChange={(date) => setNewStartDate(date)}
                          placeholder="Seleccionar fecha de inicio"
                          className="w-full"
                          enableQuickNavigation={true}
                          yearRange="both"
                          onOpenChange={setIsDatePickerOpen}
                        />
                      </div>
                      <Button size="sm" onClick={updateStartDate} disabled={!newStartDate}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingStartDate(false);
                        setNewStartDate(null);
                      }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={format(new Date(record.fechaInicio), 'dd/MM/yyyy', { locale: es })}
                        readOnly
                        className="bg-muted"
                      />
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingStartDate(true);
                        // Inicializar newStartDate con la fecha actual como objeto Date
                        setNewStartDate(new Date(record.fechaInicio));
                      }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Original: {format(new Date(record.fechaInicioOriginal), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🆕 SECCIÓN 2: ALERGENOS */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Alergenos</CardTitle>
          </CardHeader>
          <CardContent>
            {record.alergenos && record.alergenos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.alergenos.map((alergeno, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1"
                  >
                    {alergeno}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <p>No hay alergenos registrados para este paciente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 🎯 SECCIÓN 3: LOG DE APLICACIONES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Aplicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-900">Fecha</th>
                    <th className="text-left p-2 font-medium text-gray-900">Tratamiento</th>
                    <th className="text-left p-2 font-medium text-gray-900">Unidades/Frasco</th>
                    <th className="text-left p-2 font-medium text-gray-900">Dosis</th>
                    <th className="text-left p-2 font-medium text-gray-900">Aplicado Por</th>
                    <th className="text-left p-2 font-medium text-gray-900">Reacciones</th>
                    <th className="text-left p-2 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {record.log.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <span className="text-gray-900 font-medium">
                          {formatDateSafely(entry.fechaAplicacion)}
                        </span>
                      </td>
                      <td className="p-2">
                        {renderTreatmentType(entry)}
                      </td>
                      <td className="p-2">
                        {renderUnits(entry)}
                      </td>
                      <td className="p-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {entry.dosis || 1} dosis
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{entry.aplicadoPor || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{entry.aplicadoPorEmail || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        {renderReaction(entry)}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            title="Ver detalles del tratamiento"
                            onClick={() => {
                              // Mostrar detalles del tratamiento en un alert informativo
                              alert(`📋 DETALLES DEL TRATAMIENTO\n\n` +
                                    `📅 Fecha: ${formatDateSafely(entry.fechaAplicacion)}\n` +
                                    `💊 Tipo: ${entry.subtipo || 'N/A'}\n` +
                                    `📊 Unidades: ${entry.unidades || 0}\n` +
                                    `💉 Dosis: ${entry.dosis || 1}\n` +
                                    `👨‍⚕️ Aplicado por: ${entry.aplicadoPor || 'N/A'}\n` +
                                    `📧 Email: ${entry.aplicadoPorEmail || 'N/A'}\n` +
                                    `🚨 Reacción: ${entry.tuvoReaccion ? (entry.descripcionReaccion || 'Sí, sin descripción') : 'No'}\n` +
                                    `🆔 ID: ${entry.id}`);
                            }}
                          >
                            <FileText className="h-4 w-4" />
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
      </DialogContent>
    </Dialog>
  );
}

