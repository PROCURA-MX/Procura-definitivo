export interface CategoryInventoryDto {
  category: string;
  totalValue: number;
  productCount: number;
}

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

export interface ExpirationAlertDto {
  id: string;
  productId: string;
  productName: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  isExpired: boolean;
}

export interface MovementDto {
  id: string;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  totalCost: number;
  productId: string;
  productName: string;
  batchNumber: string;
  createdAt: string;
}

export interface MostUsedProductDto {
  productId: string;
  productName: string;
  category: string;
  totalExits: number;
  totalUsage: number;
  unit: string;
}

export interface ImmobilizedInventoryDto {
  id: string;
  name: string;
  productName: string;
  category: string;
  quantity: number;
  costPerUnit: number;
  totalValue: number;
  value: number;
  lastMovement: string;
  lastMovementDate: string;
  daysWithoutMovement: number;
  unit: string;
}

export interface DashboardData {
  totalInventoryValue: number;
  totalUsedInventoryCost: number;
  totalEnteredInventoryCost: number;
  lowStockAlerts: ProductInventoryDto[];
  expirationAlerts: ExpirationAlertDto[];
  inventoryByCategory: CategoryInventoryDto[];
  totalProductsByCategory: CategoryInventoryDto[];
  inventory: ProductInventoryDto[];
  mostUsedProducts: MostUsedProductDto[];
  recentMovements: MovementDto[];
  immobilizedInventory: ImmobilizedInventoryDto[];
}

export interface DashboardResponseDto {
  totalInventoryValue: number;
  totalUsedInventoryCost: number;
  totalEnteredInventoryCost: number;
  lowStockAlerts: ProductInventoryDto[];
  expirationAlerts: ExpirationAlertDto[];
  inventoryByCategory: CategoryInventoryDto[];
  totalProductsByCategory: CategoryInventoryDto[];
  inventory: ProductInventoryDto[];
  mostUsedProducts: MostUsedProductDto[];
  recentMovements: MovementDto[];
  immobilizedInventory: ImmobilizedInventoryDto[];
}
