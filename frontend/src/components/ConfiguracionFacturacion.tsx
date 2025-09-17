import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfiguracionFacturacion() {
  const [activeTab, setActiveTab] = useState('impuestos');
  const [taxConfig, setTaxConfig] = useState({
    iva: 16,
    isr: 0,
    ieps: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveTaxConfig = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Facturación</h1>
        <p className="text-gray-600">Configura impuestos, claves SAT y unidades de medida</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="impuestos" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Impuestos
          </TabsTrigger>
          <TabsTrigger value="claves-sat" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Claves SAT
          </TabsTrigger>
          <TabsTrigger value="unidades" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Unidades
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Impuestos Tab */}
        <TabsContent value="impuestos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Impuestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IVA (%)
                  </label>
                  <Input
                    type="number"
                    value={taxConfig.iva}
                    onChange={(e) => setTaxConfig(prev => ({ ...prev, iva: Number(e.target.value) }))}
                    placeholder="16"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa del Impuesto al Valor Agregado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISR (%)
                  </label>
                  <Input
                    type="number"
                    value={taxConfig.isr}
                    onChange={(e) => setTaxConfig(prev => ({ ...prev, isr: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa del Impuesto Sobre la Renta
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IEPS (%)
                  </label>
                  <Input
                    type="number"
                    value={taxConfig.ieps}
                    onChange={(e) => setTaxConfig(prev => ({ ...prev, ieps: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tasa del Impuesto Especial sobre Producción y Servicios
                  </p>
                </div>
              </div>

              {/* Resumen de Configuración */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Resumen de Configuración</h4>
                <div className="flex gap-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    IVA: {taxConfig.iva}%
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ISR: {taxConfig.isr}%
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    IEPS: {taxConfig.ieps}%
                  </Badge>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveTaxConfig}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración de Impuestos
                    </>
                  )}
                </Button>

                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Configuración guardada exitosamente</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Error al guardar la configuración</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claves SAT Tab */}
        <TabsContent value="claves-sat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Claves SAT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configuración de Claves SAT
                </h3>
                <p className="text-gray-600">
                  Esta funcionalidad estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unidades Tab */}
        <TabsContent value="unidades" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Unidades de Medida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configuración de Unidades
                </h3>
                <p className="text-gray-600">
                  Esta funcionalidad estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Configuración General
                </h3>
                <p className="text-gray-600">
                  Esta funcionalidad estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}





















