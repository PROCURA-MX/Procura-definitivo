'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pill, FileText } from 'lucide-react';
import { ImmunotherapyRecordModal } from './ImmunotherapyRecordModal';

interface ImmunotherapyRecordButtonProps {
  pacienteId: string;
  organizacionId: string;
  hasRecord?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ImmunotherapyRecordButton({
  pacienteId,
  organizacionId,
  hasRecord = false,
  variant = 'outline',
  size = 'sm'
}: ImmunotherapyRecordButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenModal}
        className="flex items-center gap-2 text-white"
      >
        {hasRecord ? (
          <>
            <FileText className="h-4 w-4" />
            Ver Expediente
          </>
        ) : (
          <>
            <Pill className="h-4 w-4" />
            Crear Expediente
          </>
        )}
      </Button>

      <ImmunotherapyRecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pacienteId={pacienteId}
        organizacionId={organizacionId}
      />
    </>
  );
}

















