import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Syringe, FlaskConical, Package } from 'lucide-react';

interface LastTreatmentBannerProps {
  lastTreatment: {
    nombrePaciente: string;
    subtipo: string;
    alergenos: string[];
    unidades: number;
    frascos: string[];
    fechaTratamiento: string;
    totalTratamientos: number;
  };
  onUseLastTreatment: () => void;
  onContinueNormal: () => void;
}

export function LastTreatmentBanner({ 
  lastTreatment, 
  onUseLastTreatment, 
  onContinueNormal 
}: LastTreatmentBannerProps) {
  
  // 🎯 FUNCIÓN PARA FORMATEAR FECHA DE MANERA DINÁMICA
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
      if (diffDays < 365) return `Hace ${Math.ceil(diffDays / 30)} meses`;
      return `Hace ${Math.ceil(diffDays / 365)} años`;
    } catch {
      return 'Fecha no disponible';
    }
  };

  // 🎯 FUNCIÓN PARA FORMATEAR TIPO DE TRATAMIENTO DE MANERA DINÁMICA
  const formatTreatmentType = (subtipo: string): string => {
    const treatmentMap: Record<string, string> = {
      'ALXOID_A': 'ALXOID A',
      'ALXOID_B': 'ALXOID B',
      'ALXOID_B.2': 'ALXOID B.2',
      'SUBLINGUAL': 'Sublingual',
      'GLICERINADO_EN_FRASCO': 'Glicerinado en Frasco',
      'GLICERINADO_POR_UNIDAD': 'Glicerinado por Unidad',
      'GLICERINADO_UNIDAD': 'Glicerinado por Unidad'
    };
    
    return treatmentMap[subtipo] || subtipo;
  };

  // 🎯 FUNCIÓN PARA FORMATEAR UNIDADES/FRASCOS DE MANERA DINÁMICA
  const formatUnits = (subtipo: string, unidades: number, frascos: string[]): string => {
    if (subtipo.includes('ALXOID')) {
      return `${unidades} dosis`;
    }
    
    if (subtipo.includes('FRASCO') && frascos.length > 0) {
      return `Frascos: ${frascos.join(', ')}`;
    }
    
    if (subtipo.includes('UNIDAD')) {
      return `${unidades} unidades`;
    }
    
    return `${unidades} unidades`;
  };

  // 🎯 FUNCIÓN PARA OBTENER ICONO DINÁMICO
  const getTreatmentIcon = (subtipo: string) => {
    if (subtipo.includes('ALXOID')) return <Syringe className="h-4 w-4" />;
    if (subtipo.includes('FRASCO')) return <FlaskConical className="h-4 w-4" />;
    if (subtipo.includes('UNIDAD')) return <Package className="h-4 w-4" />;
    return <Syringe className="h-4 w-4" />;
  };

  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <User className="h-5 w-5" />
          {lastTreatment.nombrePaciente} tiene {lastTreatment.totalTratamientos} tratamientos previos
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 🎯 INFORMACIÓN DEL ÚLTIMO TRATAMIENTO */}
        <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              {getTreatmentIcon(lastTreatment.subtipo)}
              <span className="font-medium">
                Último tratamiento: {formatTreatmentType(lastTreatment.subtipo)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <Package className="h-4 w-4" />
              <span>
                Alérgenos: {lastTreatment.alergenos.join(', ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <FlaskConical className="h-4 w-4" />
              <span>
                {formatUnits(lastTreatment.subtipo, lastTreatment.unidades, lastTreatment.frascos)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <Calendar className="h-4 w-4" />
              <span>
                Fecha: {formatDate(lastTreatment.fechaTratamiento)}
              </span>
            </div>
        </div>
        
        {/* 🎯 BOTONES DE ACCIÓN */}
        <div className="flex space-x-3 pt-2">
          <Button 
            onClick={onUseLastTreatment}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sí, usar último tratamiento
          </Button>
          
          <Button 
            onClick={onContinueNormal}
            variant="outline"
            size="sm"
            className="border-blue-300 text-white hover:bg-blue-100"
          >
            No, continuar normal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
