import { ReactNode } from 'react';

export interface ProductInventoryDto {
    id: string;
    name: string;
    category: string;
    quantity: number;
    costPerUnit: number;
    totalValue: number;
    minStockLevel: number;
    unit: string;
}

export interface CategoryInventoryDto {
    category: string;
    totalValue: number;
    productCount: number;
}

export interface ExpirationAlertDto {
    productName: string;
    category: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    status?: string;
    daysUntilExpiry?: number;
}

export interface MovementDto {
    id: string;
    productName: string;
    type: string;
    quantity: number;
    createdAt: Date;
}

export interface MostUsedProductDto {
    productName: string;
    totalExits: number;
    totalUsage: number;
}

export interface ImmobilizedInventoryDto {
    productName: string;
    quantity: number;
    value: number;
    lastMovement: Date;
    daysWithoutMovement: number;
}

export interface DashboardResponseDto {
    inventory: ProductInventoryDto[];
    inventoryByCategory: CategoryInventoryDto[];
    totalInventoryValue: number;
    totalExits: number;
    totalUsage: number;
    totalUsedInventoryCost: number;
    totalEnteredInventoryCost: number;
    lowStockAlerts: ProductInventoryDto[];
    lowStockAlertsCount: number; // 🚀 CORREGIDO: Conteo real de alertas de stock bajo
    expirationAlerts: ExpirationAlertDto[];
    mostUsedProducts: MostUsedProductDto[];
    recentMovements: MovementDto[];
    immobilizedInventory: ImmobilizedInventoryDto[];
    totalProductsByCategory: CategoryInventoryDto[];
}

export interface DashboardMetrics {
    totalInventoryValue: number;
    inventoryUsed: number;
    lowStockAlerts: number;
    expirationAlerts: number;
}

export interface DashboardCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    variant?: 'default' | 'warning' | 'danger';
}

export interface DashboardPageProps {
    searchParams: {
        sedeId?: string;
        from?: string;
        to?: string;
    };
}

        to?: string;
    };
}
