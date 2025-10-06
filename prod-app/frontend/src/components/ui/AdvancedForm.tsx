import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Input con validación
interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  mask?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  className?: string;
}

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  success = false,
  mask,
  minLength,
  maxLength,
  pattern,
  className = ''
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Validación en tiempo real
  useEffect(() => {
    if (value) {
      let valid = true;

      // Validación de longitud mínima
      if (minLength && value.length < minLength) {
        valid = false;
      }

      // Validación de longitud máxima
      if (maxLength && value.length > maxLength) {
        valid = false;
      }

      // Validación de patrón
      if (pattern && !new RegExp(pattern).test(value)) {
        valid = false;
      }

      // Validación de email
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        valid = emailRegex.test(value);
      }

      // Validación de URL
      if (type === 'url') {
        try {
          new URL(value);
        } catch {
          valid = false;
        }
      }

      setIsValid(valid);
    } else {
      setIsValid(null);
    }
  }, [value, minLength, maxLength, pattern, type]);

  // Aplicar máscara
  const applyMask = (inputValue: string) => {
    if (!mask) return inputValue;
    
    let result = '';
    let valueIndex = 0;
    
    for (let i = 0; i < mask.length && valueIndex < inputValue.length; i++) {
      if (mask[i] === '#') {
        result += inputValue[valueIndex];
        valueIndex++;
      } else {
        result += mask[i];
      }
    }
    
    return result;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (mask) {
      newValue = applyMask(newValue.replace(/[^0-9]/g, ''));
    }
    
    onChange(newValue);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-300' : success ? 'border-green-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${type === 'password' ? 'pr-10' : ''}
            ${isValid === false ? 'border-red-300' : isValid === true ? 'border-green-300' : ''}
          `}
        />
        
        {/* Iconos de estado */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}
          
          {isValid === false && (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          )}
          
          {isValid === true && (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>
      
      {/* Mensajes de error y ayuda */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {isValid === false && !error && (
        <p className="text-sm text-red-600">
          {type === 'email' && 'Por favor ingresa un email válido'}
          {type === 'url' && 'Por favor ingresa una URL válida'}
          {minLength && value.length < minLength && `Mínimo ${minLength} caracteres`}
          {maxLength && value.length > maxLength && `Máximo ${maxLength} caracteres`}
          {pattern && 'El formato no es válido'}
        </p>
      )}
      
      {isValid === true && (
        <p className="text-sm text-green-600">✓ Válido</p>
      )}
    </div>
  );
}

// Select con búsqueda
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  className?: string;
}

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  error,
  searchable = false,
  className = ''
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
          `}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {searchable && (
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                autoFocus
              />
            )}
            
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  disabled={option.disabled}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                    ${option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Textarea con contador de caracteres
interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  rows = 4,
  maxLength,
  className = ''
}: TextareaProps) {
  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      />
      
      {/* Contador de caracteres */}
      {maxLength && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{characterCount} caracteres</span>
          <span className={isNearLimit ? 'text-orange-500' : ''}>
            {maxLength - characterCount} restantes
          </span>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Checkbox
interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Checkbox({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  className = ''
}: CheckboxProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`
            w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
