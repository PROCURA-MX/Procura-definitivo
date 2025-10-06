import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Settings, Users, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';
import facturacionService from '@/services/facturacionService';
import ConfiguracionFacturacion from '@/components/ConfiguracionFacturacion';

export default function Facturacion() {
  const [showConfig, setShowConfig] = useState(false);
  
  const handleRedirectToPortal = () => {
    facturacionService.openPortal();
  };

  const isConfigured = facturacionService.isConfigured();

  // Si se está mostrando la configuración, renderizar el componente de configuración
  if (showConfig) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowConfig(false)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Módulo de Facturación
          </Button>
        </div>
        <ConfiguracionFacturacion />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Módulo de Facturación</h1>
        <p className="text-gray-600">Accede al portal de facturación para gestionar tus documentos fiscales</p>
      </div>

      {/* Configuration Warning */}
      {!isConfigured && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  Configuración Pendiente
                </h4>
                <p className="text-yellow-800 text-sm">
                  El módulo de facturación requiere configuración. Contacta al administrador 
                  para configurar las credenciales del proveedor de facturación.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portal Access Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            Portal de Facturación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-6">
              <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Accede al Portal de Facturación
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Gestiona tus facturas, notas de crédito, clientes y configuraciones fiscales 
                desde nuestro portal integrado.
              </p>
            </div>
            
            <Button 
              onClick={handleRedirectToPortal}
              disabled={!isConfigured}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              {isConfigured ? 'Ir al Portal de Facturación' : 'Portal No Disponible'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facturas</h3>
              <p className="text-gray-600 text-sm">
                Crear y gestionar facturas electrónicas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clientes</h3>
              <p className="text-gray-600 text-sm">
                Administrar catálogo de clientes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowConfig(true)}>
          <CardContent className="p-6">
            <div className="text-center">
              <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración</h3>
              <p className="text-gray-600 text-sm">
                Configurar datos fiscales y preferencias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Información de Integración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">i</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  Integración con Proveedor de Facturación
                </h4>
                <p className="text-blue-800 text-sm">
                  Este módulo está integrado con un proveedor de servicios de facturación. 
                  Al hacer clic en "Ir al Portal de Facturación" serás redirigido a una nueva ventana 
                  donde podrás gestionar todos los aspectos de facturación de forma segura.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 