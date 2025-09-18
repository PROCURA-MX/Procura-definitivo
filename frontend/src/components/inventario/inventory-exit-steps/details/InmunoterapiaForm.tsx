'use client'

import { useState, useEffect } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { InventoryUsageInput, InventoryUsageDetailInput } from '@/schemas/inventory-usage'
import { useProducts } from '@/hooks/useProducts'

// --- DATA CONSTANTS ---
const INMUNOTERAPIA_SUBTYPES = {
  glicerinado: 'Glicerinado',
  alxoid: 'Alxoid',
  sublingual: 'Sublingual',
}

const ALERGENOS_DATA = {
  glicerinado: ['Abedul', 'Ácaros', 'Álamo del este', 'Ambrosía', 'Caballo', 'Camarón', 'Ciprés de Arizona', 'Encino', 'Fresno blanco', 'Gato', 'Manzana', 'Cucaracha', 'Mezcla pastos', 'Perro', 'Pescado varios', 'Pino blanco', 'Pistache', 'Trueno'],
  sublingual: ['Abedul', 'Ácaros', 'Álamo del este', 'Alheña', 'Ambrosía', 'Caballo', 'Camarón', 'Ciprés de Arizona', 'Encino', 'Fresno blanco', 'Gato', 'Manzana', 'Mezcla cucarachas', 'Mezcla pastos', 'Mezquite', 'Perro', 'Pescado varios', 'Pino blanco', 'Pistache', 'Sweet gum', 'Trueno'],
  // Alérgenos exclusivos de Alxoid - Tipo A
  alxoidA: [
    'Cupressus Arizónica A', 'Fresno A', 'Gramínea con sinodon A', 'Sinodon A', '6 Gramíneas A',
    'Ambrosía A', 'Ácaros A', 'Encino A', 'Gato A', 'Perro A'
  ],
  // Alérgenos exclusivos de Alxoid - Tipo B
  alxoidB: [
    'Cupressus Arizónica B', 'Fresno B', 'Gramínea con sinodon B', 'Sinodon B', '6 Gramíneas B',
    'Ambrosía B', 'Ácaros B', 'Encino B', 'Gato B', 'Perro B'
  ],
  // Alérgenos legacy (para compatibilidad) - SOLO los que NO tienen duplicados
  alxoid: ['Ambrosía A', 'Ambrosía B', 'Ácaros A', 'Ácaros B', 'Encino A', 'Encino B', 'Gato A', 'Gato B', 'Perro A', 'Perro B'],
}

// --- SUB-FORMS ---

function LocalList({ localItems, onRemove }: { localItems: InventoryUsageDetailInput[], onRemove: (idx: number) => void }) {
  if (localItems.length === 0) {
    return (
      <div className="text-gray-500 italic text-sm">
        No hay detalles agregados aún. Selecciona alérgenos y haz clic en "Añadir Detalle".
      </div>
    )
  }
  
  return (
    <ul className="space-y-2">
      {localItems.map((item, idx) => (
        <li key={idx} className="flex justify-between items-center border rounded p-2 bg-blue-50">
          <div className="flex-1">
            <div className="font-medium text-gray-800">
              {item.subtipo} - {item.cantidad} unidades
            </div>
            <div className="text-sm text-gray-600">
              {item.alergenos && item.alergenos.length > 0 && (
                <span className="text-green-600">Alérgenos: {item.alergenos.join(', ')}</span>
              )}
              {item.frasco && <span className="ml-2">Frasco: {item.frasco}</span>}
              {item.doses && <span className="ml-2">Dosis: {item.doses}</span>}
            </div>
          </div>
          <Button type="button" size="sm" variant="destructive" onClick={() => onRemove(idx)}>
            Eliminar
          </Button>
        </li>
      ))}
    </ul>
  )
}

function GlicerinadoForm({ onAdd, prefillData }: { onAdd: (detail: InventoryUsageDetailInput) => void, prefillData?: any }) {
  const [mode, setMode] = useState<'unidad' | 'frasco'>('unidad')
  const [unidades, setUnidades] = useState<number | ''>(1);
  const [dosis, setDosis] = useState<number | ''>(1);
  const [frascoUnidad, setFrascoUnidad] = useState('Madre');
  const [selectedFrascos, setSelectedFrascos] = useState<string[]>([]);
  const [numFrascosMismo, setNumFrascosMismo] = useState<number | ''>(1);
  const [selectedAlergenos, setSelectedAlergenos] = useState<string[]>([]);
  
  // 🎯 PRE-RELLENAR DATOS DESDE ÚLTIMO TRATAMIENTO
  useEffect(() => {
    if (prefillData) {
      console.log('🔍 [GlicerinadoForm] Procesando datos de pre-rellenado:', prefillData)
      
      // Pre-rellenar alérgenos
      if (prefillData.alergenos && Array.isArray(prefillData.alergenos)) {
        setSelectedAlergenos(prefillData.alergenos)
        console.log('✅ [GlicerinadoForm] Alérgenos pre-rellenados:', prefillData.alergenos)
      }
      
      // Pre-rellenar unidades
      if (prefillData.unidades) {
        setUnidades(prefillData.unidades)
        console.log('✅ [GlicerinadoForm] Unidades pre-rellenadas:', prefillData.unidades)
      }
      
      // Pre-rellenar frascos si es glicerinado en frasco
      if (prefillData.frascos && Array.isArray(prefillData.frascos) && prefillData.frascos.length > 0) {
        setMode('frasco')
        setSelectedFrascos(prefillData.frascos)
        setNumFrascosMismo(prefillData.frascos.length)
        console.log('✅ [GlicerinadoForm] Frascos pre-rellenados:', prefillData.frascos)
      } else if (prefillData.subtipo && prefillData.subtipo.includes('UNIDAD')) {
        setMode('unidad')
        setFrascoUnidad('Madre') // Valor por defecto
        console.log('✅ [GlicerinadoForm] Modo unidad pre-rellenado')
      }
      
      // 🎯 IMPORTANTE: NO pre-rellenar dosis - deben quedar vacías para decisión en el momento
      console.log('ℹ️ [GlicerinadoForm] Dosis intencionalmente vacías para decisión en el momento')
    }
  }, [prefillData])
  
  const handleAdd = () => {
    if (selectedAlergenos.length === 0) {
      alert('Por favor, seleccione al menos un alérgeno.');
      return;
    }

    let detail: InventoryUsageDetailInput;

    if (mode === 'unidad') {
      detail = {
        subtipo: 'GLICERINADO_UNIDAD',
        productId: 'glicerinado-unidad',
        cantidad: unidades || 1,
        alergenos: selectedAlergenos,
        frasco: frascoUnidad,
        doses: dosis || 1,
      };
    } else { // mode === 'frasco'
      if (selectedFrascos.length === 0) {
        alert('Por favor, seleccione al menos un número de frasco.');
        return;
      }
      detail = {
        subtipo: 'GLICERINADO_FRASCO',
        productId: 'glicerinado-frasco',
        cantidad: numFrascosMismo || 1,
        alergenos: selectedAlergenos,
        frasco: `Frascos: ${selectedFrascos.join(', ')}`,
        doses: numFrascosMismo || 1, // 🎯 AGREGAR CAMPO DOSES
      };
    }
    
    onAdd(detail);
    
    setUnidades(1);
    setDosis(1);
    setFrascoUnidad('Madre');
    setSelectedFrascos([]);
    setNumFrascosMismo(1);
    setSelectedAlergenos([]);
  }

  return (
    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
      <h4 className="font-semibold text-lg">Glicerinado</h4>
      
      <RadioGroup value={mode} onValueChange={(value: 'unidad' | 'frasco') => setMode(value)} className="flex space-x-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="unidad" id="unidad" />
          <Label htmlFor="unidad">Por Unidad</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="frasco" id="frasco" />
          <Label htmlFor="frasco">En Frasco</Label>
        </div>
      </RadioGroup>

      {mode === 'unidad' && (
        <div className="space-y-4">
          <Label>Unidades</Label>
          <Input type="number" value={unidades} onChange={(e) => setUnidades(e.target.value === '' ? '' : Number(e.target.value))} min="1" />
          <Label>Frasco</Label>
          <Select value={frascoUnidad} onValueChange={setFrascoUnidad}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Madre">Madre</SelectItem>
              <SelectItem value="Amarillo">Amarillo</SelectItem>
              <SelectItem value="Verde">Verde</SelectItem>
            </SelectContent>
          </Select>
          <Label>¿Cuántas dosis? (1-12)</Label>
          <Input type="number" value={dosis} onChange={(e) => setDosis(e.target.value === '' ? '' : Number(e.target.value))} min="1" max="12" />
        </div>
      )}
      
      {mode === 'frasco' && (
        <div className="space-y-4">
            <div>
                <Label>¿Qué frascos?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`frasco-${i+1}`}
                                onCheckedChange={(checked) => {
                                    const frascoNum = (i + 1).toString();
                                    setSelectedFrascos(prev => checked ? [...prev, frascoNum] : prev.filter(f => f !== frascoNum))
                                }}
                                checked={selectedFrascos.includes((i+1).toString())}
                            />
                            <Label htmlFor={`frasco-${i+1}`}>{i+1}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <Label>¿Cuántos frascos del mismo? (1-5)</Label>
                <Select value={numFrascosMismo.toString()} onValueChange={(val) => setNumFrascosMismo(Number(val))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {[...Array(5)].map((_, i) => (
                            <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      )}

      <div>
        <Label>Alérgenos (máx. 6)</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
          {ALERGENOS_DATA.glicerinado.map(alergeno => (
            <div key={alergeno} className="flex items-center space-x-2">
              <Checkbox 
                id={`glicerinado-${alergeno}`}
                onCheckedChange={(checked) => {
                  setSelectedAlergenos(prev => checked ? [...prev, alergeno] : prev.filter(a => a !== alergeno))
                }}
                checked={selectedAlergenos.includes(alergeno)}
                disabled={selectedAlergenos.length >= 6 && !selectedAlergenos.includes(alergeno)}
              />
              <Label htmlFor={`glicerinado-${alergeno}`}>{alergeno}</Label>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleAdd} type="button" className="w-full">Añadir Detalle de Glicerinado</Button>
    </div>
  )
}

function AlxoidForm({ onAdd, prefillData }: { onAdd: (detail: InventoryUsageDetailInput) => void, prefillData?: any }) {
  const [tipoAlxoid, setTipoAlxoid] = useState('A');
  const [dosis, setDosis] = useState<number | ''>(1);
  const [selectedAlergenos, setSelectedAlergenos] = useState<string[]>([]);
  
  // 🎯 PRE-RELLENAR DATOS DESDE ÚLTIMO TRATAMIENTO
  useEffect(() => {
    if (prefillData) {
      console.log('🔍 [AlxoidForm] Procesando datos de pre-rellenado:', prefillData)
      
      // Pre-rellenar tipo de ALXOID
      if (prefillData.subtipo) {
        const subtipo = prefillData.subtipo.toUpperCase()
        if (subtipo.includes('ALXOID_A')) {
          setTipoAlxoid('A')
        } else if (subtipo.includes('ALXOID_B.2')) {
          setTipoAlxoid('B.2')
        } else if (subtipo.includes('ALXOID_B')) {
          setTipoAlxoid('B')
        }
        console.log('✅ [AlxoidForm] Tipo ALXOID pre-rellenado:', subtipo)
      }
      
      // Pre-rellenar alérgenos
      if (prefillData.alergenos && Array.isArray(prefillData.alergenos)) {
        setSelectedAlergenos(prefillData.alergenos)
        console.log('✅ [AlxoidForm] Alérgenos pre-rellenados:', prefillData.alergenos)
      }
      
      // 🎯 IMPORTANTE: NO pre-rellenar dosis - deben quedar vacías para decisión en el momento
      console.log('ℹ️ [AlxoidForm] Dosis intencionalmente vacías para decisión en el momento')
    }
  }, [prefillData])

  // Obtener alérgenos según el tipo seleccionado
  const getAlergenosByType = (tipo: string) => {
    switch (tipo) {
      case 'A':
        return ALERGENOS_DATA.alxoidA;
      case 'B':
      case 'B.2':
        return ALERGENOS_DATA.alxoidB;
      default:
        return ALERGENOS_DATA.alxoidA;
    }
  };

  // Limpiar alérgenos seleccionados cuando cambie el tipo
  const handleTipoChange = (newTipo: string) => {
    setTipoAlxoid(newTipo);
    setSelectedAlergenos([]); // Limpiar selección al cambiar tipo
  };

  const handleAdd = () => {
    if (selectedAlergenos.length === 0) {
      alert('Por favor, seleccione al menos un alérgeno.');
      return;
    }

    onAdd({
      subtipo: `ALXOID_${tipoAlxoid}`,
      productId: tipoAlxoid === 'A' ? 'alxoid-tipo-a' : 
                 tipoAlxoid === 'B' ? 'alxoid-tipo-b' : 'alxoid-tipo-b',
      cantidad: 1, // ALXOID siempre es cantidad 1 (no tiene unidades)
      doses: dosis || 1, // 🎯 CORREGIDO: Enviar dosis en el campo correcto
      alergenos: selectedAlergenos,
    });

    // Reset local state
    setTipoAlxoid('A');
    setDosis(1);
    setSelectedAlergenos([]);
  }

  const alergenosDisponibles = getAlergenosByType(tipoAlxoid);

  return (
    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
      <h4 className="font-semibold text-lg">Alxoid</h4>
      <Label>Tipo</Label>
      <Select value={tipoAlxoid} onValueChange={handleTipoChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="A">Tipo A</SelectItem>
          <SelectItem value="B">Tipo B</SelectItem>
          <SelectItem value="B.2">Tipo B.2</SelectItem>
        </SelectContent>
      </Select>
      <Label>¿Cuántas dosis? (1-10)</Label>
      <Input type="number" value={dosis} onChange={(e) => setDosis(e.target.value === '' ? '' : Number(e.target.value))} min="1" max="10" />
      <div>
        <Label>Alérgenos (Tipo {tipoAlxoid})</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
          {alergenosDisponibles.map(alergeno => (
            <div key={alergeno} className="flex items-center space-x-2">
              <Checkbox 
                id={`alxoid-${alergeno}`}
                onCheckedChange={(checked) => {
                  setSelectedAlergenos(prev => checked ? [...prev, alergeno] : prev.filter(a => a !== alergeno))
                }}
                checked={selectedAlergenos.includes(alergeno)}
              />
              <Label htmlFor={`alxoid-${alergeno}`}>{alergeno}</Label>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleAdd} type="button" className="w-full">Añadir Detalle de Alxoid</Button>
    </div>
  )
}

function SublingualForm({ onAdd, prefillData }: { onAdd: (detail: InventoryUsageDetailInput) => void, prefillData?: any }) {
  const [numeroFrasco, setNumeroFrasco] = useState<number | ''>(1);
  const [selectedAlergenos, setSelectedAlergenos] = useState<string[]>([]);
  
  // 🎯 PRE-RELLENAR DATOS DESDE ÚLTIMO TRATAMIENTO
  useEffect(() => {
    if (prefillData) {
      console.log('🔍 [SublingualForm] Procesando datos de pre-rellenado:', prefillData)
      
      // Pre-rellenar alérgenos
      if (prefillData.alergenos && Array.isArray(prefillData.alergenos)) {
        setSelectedAlergenos(prefillData.alergenos)
        console.log('✅ [SublingualForm] Alérgenos pre-rellenados:', prefillData.alergenos)
      }
      
      // Pre-rellenar número de frasco
      if (prefillData.frascos && Array.isArray(prefillData.frascos) && prefillData.frascos.length > 0) {
        // Tomar el primer frasco como número de frasco
        const primerFrasco = prefillData.frascos[0]
        setNumeroFrasco(parseInt(primerFrasco) || 1)
        console.log('✅ [SublingualForm] Número de frasco pre-rellenado:', primerFrasco)
      }
      
      // 🎯 IMPORTANTE: NO pre-rellenar dosis - deben quedar vacías para decisión en el momento
      console.log('ℹ️ [SublingualForm] Dosis intencionalmente vacías para decisión en el momento')
    }
  }, [prefillData])

  const handleAdd = () => {
    if (selectedAlergenos.length === 0) {
      alert('Por favor, seleccione al menos un alérgeno.');
      return;
    }

    onAdd({
      subtipo: 'SUBLINGUAL',
      productId: `Sublingual Frasco #${numeroFrasco}`,
      cantidad: 1, // La cantidad es implícitamente 1 frasco
      alergenos: selectedAlergenos,
      frasco: (numeroFrasco || 1).toString(),
    });

    // Reset local state
    setNumeroFrasco(1);
    setSelectedAlergenos([]);
  }

  return (
    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
      <h4 className="font-semibold text-lg">Sublingual</h4>
      <Label>Número de frasco (1-4)</Label>
      <Input type="number" value={numeroFrasco} onChange={(e) => setNumeroFrasco(e.target.value === '' ? '' : Number(e.target.value))} min="1" max="4" />
      
      <div>
        <Label>Alérgenos</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
          {ALERGENOS_DATA.sublingual.map(alergeno => (
            <div key={alergeno} className="flex items-center space-x-2">
              <Checkbox 
                id={`sublingual-${alergeno}`}
                onCheckedChange={(checked) => {
                  setSelectedAlergenos(prev => checked ? [...prev, alergeno] : prev.filter(a => a !== alergeno))
                }}
                checked={selectedAlergenos.includes(alergeno)}
              />
              <Label htmlFor={`sublingual-${alergeno}`}>{alergeno}</Label>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleAdd} type="button" className="w-full">Añadir Detalle de Sublingual</Button>
    </div>
  )
}

// --- MAIN FORM COMPONENT ---

export function InmunoterapiaForm({ append, fields, onBack, setLocalItemsRef, prefillData }: { append: (value: any[]) => void, fields: any[], onBack?: () => void, setLocalItemsRef?: any, prefillData?: any }) {
  const [subType, setSubType] = useState<keyof typeof INMUNOTERAPIA_SUBTYPES | null>(null)
  
  // 🎯 ESTADO LOCAL COMO BACKUP - Para garantizar que los items se agreguen
  const [localItems, setLocalItems] = useState<InventoryUsageDetailInput[]>([])
  
  // 🎯 SINCRONIZAR ESTADO LOCAL CON FIELDS DEL FORMULARIO PRINCIPAL
  useEffect(() => {
    if (fields && fields.length > 0) {
      setLocalItems(fields)
    }
  }, [fields])

  // 🎯 PRE-RELLENAR DATOS DESDE ÚLTIMO TRATAMIENTO
  useEffect(() => {
    if (prefillData) {
      console.log('🔍 [InmunoterapiaForm] Procesando datos de pre-rellenado:', prefillData)
      
      // Mapear subtipo del backend al frontend
      let mappedSubType: keyof typeof INMUNOTERAPIA_SUBTYPES | null = null
      
      if (prefillData.subtipo) {
        const subtipo = prefillData.subtipo.toLowerCase()
        if (subtipo.includes('alxoid')) {
          mappedSubType = 'alxoid'
        } else if (subtipo.includes('sublingual')) {
          mappedSubType = 'sublingual'
        } else if (subtipo.includes('glicerinado')) {
          mappedSubType = 'glicerinado'
        }
      }
      
      if (mappedSubType) {
        console.log('✅ [InmunoterapiaForm] Subtipo mapeado:', mappedSubType)
        setSubType(mappedSubType)
      }
    }
  }, [prefillData])

  // Pre-seleccionar subtipo si viene de búsqueda rápida
  useEffect(() => {
    const selectedProductData = localStorage.getItem('selectedProduct');
    if (selectedProductData) {
      try {
        const product = JSON.parse(selectedProductData);
        const productName = product.name.toLowerCase();
        
        // Detectar el subtipo basado en el nombre del producto
        if (productName.includes('glicerinado')) {
          setSubType('glicerinado');
        } else if (productName.includes('alxoid')) {
          setSubType('alxoid');
        } else if (productName.includes('sublingual')) {
          setSubType('sublingual');
        }
        
        // Limpiar localStorage después de usarlo
        localStorage.removeItem('selectedProduct');
      } catch (error) {
        console.error('Error parsing selected product:', error);
        localStorage.removeItem('selectedProduct');
      }
    }
  }, []);

  const handleAddLocal = (detail: InventoryUsageDetailInput) => {
    console.log('🔍 [InmunoterapiaForm] handleAddLocal llamado con:', detail)
    console.log('🔍 [InmunoterapiaForm] append disponible:', !!append)
    console.log('🔍 [InmunoterapiaForm] fields actuales:', fields)
    
    // 🎯 AGREGAR AL ESTADO LOCAL PRIMERO (GARANTÍA DE FUNCIONAMIENTO)
    setLocalItems(prev => {
      const newItems = [...prev, detail]
      console.log('✅ [InmunoterapiaForm] Estado local actualizado:', newItems)
      
      // 🎯 ACTUALIZAR REFERENCIA GLOBAL PARA ACCESO DESDE FORMULARIO PRINCIPAL
      if (setLocalItemsRef) {
        setLocalItemsRef(newItems)
      }
      
      return newItems
    })
    
    // 🎯 INTENTAR AGREGAR AL FORMULARIO PRINCIPAL
    try {
      append([detail])
      console.log('✅ [InmunoterapiaForm] append ejecutado exitosamente')
      console.log('🔍 [InmunoterapiaForm] fields después de append:', fields)
    } catch (error) {
      console.error('❌ [InmunoterapiaForm] Error en append:', error)
      console.log('⚠️ [InmunoterapiaForm] Usando solo estado local como backup')
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inmunoterapia</CardTitle>
        {onBack && (
          <Button type="button" variant="outline" size="sm" onClick={onBack} className="ml-auto">
            Regresar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <div>
          <Label>Subtipo de Inmunoterapia</Label>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {Object.entries(INMUNOTERAPIA_SUBTYPES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`flex-1 px-4 py-3 rounded-xl border-2 shadow-sm text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 hover:scale-[1.03] hover:shadow-md bg-white
                  ${subType === key ? 'border-primary ring-2 ring-primary/30 bg-primary/5 text-primary' : 'border-gray-200 text-gray-900'}`}
                onClick={() => setSubType(key as keyof typeof INMUNOTERAPIA_SUBTYPES)}
                tabIndex={0}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {subType === 'glicerinado' && <GlicerinadoForm onAdd={handleAddLocal} prefillData={prefillData} />}
        {subType === 'alxoid' && <AlxoidForm onAdd={handleAddLocal} prefillData={prefillData} />}
        {subType === 'sublingual' && <SublingualForm onAdd={handleAddLocal} prefillData={prefillData} />}
        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-medium text-gray-900">Detalles guardados:</h3>
          <LocalList localItems={localItems} onRemove={(idx) => {
            setLocalItems(prev => prev.filter((_, i) => i !== idx))
          }} />
        </div>
      </CardContent>
    </Card>
  )
} 