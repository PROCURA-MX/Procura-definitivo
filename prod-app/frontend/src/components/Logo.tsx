import React from 'react';
import logo from '../assets/LOGO-PROCURA-F.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-28',
    xl: 'h-56'
  };

  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <img
        src={logo}
        alt="Logo Tu Procura"
        className={`${sizeClasses[size]} w-auto`}
        draggable={false}
        style={{ maxWidth: '220px' }}
      />
    </div>
  );
} 