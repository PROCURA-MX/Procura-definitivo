import React from 'react';

interface SmartNumberProps {
  value: number;
  isCurrency?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export function SmartNumber({ 
  value, 
  isCurrency = false, 
  className = "",
  showTooltip = false 
}: SmartNumberProps) {
  const formatSmartNumber = (value: number, isCurrency: boolean = false) => {
    if (value === 0) return isCurrency ? "$0" : "0";
    
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    
    if (absValue >= 1e9) {
      const formatted = (absValue / 1e9).toFixed(1);
      return `${sign}${isCurrency ? "$" : ""}${formatted}B`;
    } else if (absValue >= 1e6) {
      const formatted = (absValue / 1e6).toFixed(1);
      return `${sign}${isCurrency ? "$" : ""}${formatted}M`;
    } else if (absValue >= 1e3) {
      const formatted = (absValue / 1e3).toFixed(1);
      return `${sign}${isCurrency ? "$" : ""}${formatted}K`;
    } else {
      if (isCurrency) {
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(value);
      }
      return value.toLocaleString();
    }
  };

  const formatFullNumber = (value: number, isCurrency: boolean = false) => {
    if (isCurrency) {
      return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(value);
    }
    return value.toLocaleString();
  };

  const smartValue = formatSmartNumber(value, isCurrency);
  const fullValue = formatFullNumber(value, isCurrency);
  
  // Si el valor formateado es diferente al valor completo y showTooltip está habilitado
  if (showTooltip && smartValue !== fullValue) {
    return (
      <span 
        className={`cursor-help ${className}`}
        title={`${fullValue}`}
      >
        {smartValue}
      </span>
    );
  }
  
  return <span className={className}>{smartValue}</span>;
} 