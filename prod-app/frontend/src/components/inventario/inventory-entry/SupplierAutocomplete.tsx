import React, { useState } from 'react'

interface SupplierAutocompleteProps {
  value: string
  onChange: (value: string) => void
  suppliers?: string[]
}

export default function SupplierAutocomplete({ value, onChange, suppliers = [] }: SupplierAutocompleteProps) {
  const [customSupplier, setCustomSupplier] = useState('')
  const [isOther, setIsOther] = useState(false)

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Proveedor</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={isOther ? 'other' : value}
        onChange={e => {
          if (e.target.value === 'other') {
            setIsOther(true)
            onChange('')
          } else {
            setIsOther(false)
            onChange(e.target.value)
          }
        }}
      >
        <option value="">Selecciona un proveedor...</option>
        {suppliers.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
        <option value="other">Otro...</option>
      </select>
      {isOther && (
        <input
          className="w-full border rounded px-3 py-2 mt-2"
          placeholder="Nombre del proveedor"
          value={customSupplier}
          onChange={e => {
            setCustomSupplier(e.target.value)
            onChange(e.target.value)
          }}
        />
      )}
    </div>
  )
} 