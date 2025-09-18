import type { ProductInventoryDto, ExpirationAlertDto } from '@/types/dashboard';
interface DashboardMetricsProps {
    totalInventoryValue: number;
    totalUsedInventoryCost: number;
    lowStockAlerts: ProductInventoryDto[];
    expirationAlerts: ExpirationAlertDto[];
}
export declare function DashboardMetrics({ totalInventoryValue, totalUsedInventoryCost, lowStockAlerts, expirationAlerts, }: DashboardMetricsProps): import("react").JSX.Element;
export {};
