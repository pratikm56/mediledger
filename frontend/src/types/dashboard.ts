import type { MedicineStock, MedicineBatch } from './inventory';
import type { Sale } from './sale';

export interface DashboardSummary {
  // Today's Operational Financials
  todaySalesAmount: number;
  todaySalesCount: number;
  todayPurchasesAmount: number;
  todayPurchasesCount: number;
  todayExpensesAmount: number;
  todayExpensesCount: number;
  todayCostOfGoodsSold: number;
  todayGrossProfit: number;
  todayNetProfit: number;

  // Cumulative / Overall Financials
  totalSalesAmount: number;
  totalPurchasesAmount: number;
  totalExpensesAmount: number;
  totalCostOfGoodsSold: number;
  totalGrossProfit: number;
  totalNetProfit: number;

  // Inventory & Valuation Metrics
  totalMedicines: number;
  totalBatches: number;
  totalStockUnits: number;
  totalStockPurchaseValue: number;
  totalStockSellingValue: number;
  totalStockMrpValue: number;

  // Operational Stock & Expiry Alerts
  lowStockCount: number;
  expiringWithin30DaysCount: number;
  expiringWithin90DaysCount: number;
  expiredBatchesCount: number;

  // Ledger Outstanding Balances
  customerOutstanding: number;
  supplierOutstanding: number;
}

export interface DashboardTrendItem {
  date: string;
  formattedDate: string;
  salesAmount: number;
  salesCount: number;
  purchasesAmount: number;
  purchasesCount: number;
  expensesAmount: number;
  expensesCount: number;
  cogsAmount: number;
  grossProfit: number;
  netProfit: number;
}

export interface DashboardAlerts {
  lowStockItems: MedicineStock[];
  expiringItems: MedicineBatch[];
  expiredItems: MedicineBatch[];
  recentSales: Sale[];
}
