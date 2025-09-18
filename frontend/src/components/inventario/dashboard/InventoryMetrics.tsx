"use client"

import { TrendingUp } from 'lucide-react'
import type { CategoryInventoryDto, ProductInventoryDto } from '@/types/dashboard'

interface InventoryMetricsProps {
  inventoryByCategory: CategoryInventoryDto[]
  totalProductsByCategory: CategoryInventoryDto[]
  inventory?: ProductInventoryDto[]
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function InventoryMetrics({ inventory = [] }: InventoryMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Aquí solo van otros bloques de métricas secundarias si existen, pero NO alertas de stock bajo */}
    </div>
  )
} 