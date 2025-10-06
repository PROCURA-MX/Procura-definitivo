import React from 'react';

interface ExactValueDisplayProps {
  value: number;
  isCurrency?: boolean;
  className?: string;
  showExactOnHover?: boolean;
}

export function ExactValueDisplay({ 
  value, 
  isCurrency = false, 
  className = "",
  showExactOnHover = true
}: ExactValueDisplayProps) {
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
  
  // Si showExactOnHover está habilitado y los valores son diferentes
  if (showExactOnHover && smartValue !== fullValue) {
    return (
      <span 
        className={`cursor-help ${className}`}
        title={`Valor exacto: ${fullValue}`}
      >
        {smartValue}
      </span>
    );
  }
  
  return <span className={className}>{smartValue}</span>;
}
















