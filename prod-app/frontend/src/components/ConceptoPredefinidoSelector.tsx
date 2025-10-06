import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import predefinedConcepts from "../data/predefinedConcepts.json";

interface PredefinedConcept {
  id: string;
  nombre: string;
  descripcion: string;
  clave_sat: string;
  clave_unidad: string;
  categoria: string;
}

interface ConceptoPredefinidoSelectorProps {
  onSelectPredefined: (concepto: PredefinedConcept, precio: number) => void;
  onCreateCustom: () => void;
  placeholder?: string;
}

export default function ConceptoPredefinidoSelector({ 
  onSelectPredefined, 
  onCreateCustom,
  placeholder = "🔍 Buscar concepto predefinido..." 
}: ConceptoPredefinidoSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConceptos, setFilteredConceptos] = useState<PredefinedConcept[]>(predefinedConcepts);
  const [selectedConcepto, setSelectedConcepto] = useState<PredefinedConcept | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [precio, setPrecio] = useState("");

  // Agrupar conceptos por categoría
  const conceptosPorCategoria = filteredConceptos.reduce((acc, concepto) => {
    if (!acc[concepto.categoria]) {
      acc[concepto.categoria] = [];
    }
    acc[concepto.categoria].push(concepto);
    return acc;
  }, {} as Record<string, PredefinedConcept[]>);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredConceptos(predefinedConcepts);
      return;
    }
    
    const filtered = predefinedConcepts.filter(concepto => {
      const nombre = concepto.nombre.toLowerCase();
      const descripcion = concepto.descripcion.toLowerCase();
      const categoria = concepto.categoria.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return nombre.includes(search) || 
             descripcion.includes(search) || 
             categoria.includes(search);
    });
    
    setFilteredConceptos(filtered);
  }, [searchTerm]);

  const selectConcepto = (concepto: PredefinedConcept) => {
    setSelectedConcepto(concepto);
    setShowPriceModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePriceSubmit = () => {
    if (selectedConcepto && precio && !isNaN(Number(precio)) && Number(precio) > 0) {
      onSelectPredefined(selectedConcepto, Number(precio));
      setShowPriceModal(false);
      setSelectedConcepto(null);
      setPrecio("");
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case "Consultas":
        return "🩺";
      case "Alergia – Tratamientos/Pruebas":
        return "🔬";
      case "Pruebas diagnósticas adicionales":
        return "🧪";
      case "Vacunas":
        return "💉";
      case "Medicamentos e inmunoterapia":
        return "💊";
      case "Gammaglobulinas / Inmunoglobulinas":
        return "🩸";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Lista de conceptos organizados por categoría */}
      <div className="max-h-96 overflow-y-auto space-y-6">
        {Object.entries(conceptosPorCategoria).map(([categoria, conceptos]) => (
          <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-green-50 text-sm font-semibold text-gray-900 border-b border-gray-200">
              {getCategoryIcon(categoria)} {categoria} ({conceptos.length} conceptos)
            </div>
            <div className="divide-y divide-gray-100">
              {conceptos.map((concepto) => (
                <div
                  key={concepto.id}
                  className="px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white text-lg">{concepto.nombre}</div>
                      <div className="text-sm text-gray-200 mt-1">{concepto.descripcion}</div>
                      <div className="text-xs text-gray-300 mt-2 flex gap-4">
                        <span>SAT: {concepto.clave_sat}</span>
                        <span>Unidad: {concepto.clave_unidad}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => selectConcepto(concepto)}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0"
                    >
                      + Agregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Botón para crear concepto personalizado */}
      <div className="flex justify-center pt-4 border-t border-gray-200">
        <Button
          onClick={onCreateCustom}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
        >
          + Crear Concepto Personalizado
        </Button>
      </div>

      {/* Modal para ingresar precio */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              💰 Ingresar Precio
            </DialogTitle>
            <DialogDescription>
              Ingresa el precio base para el concepto seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedConcepto && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">{selectedConcepto.nombre}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedConcepto.descripcion}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Base (MXN)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPriceModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePriceSubmit}
                disabled={!precio || isNaN(Number(precio)) || Number(precio) <= 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Agregar Concepto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}