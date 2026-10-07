import type { PaymentMode, PaymentStatus } from './purchase';

export interface SalesReportItem {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  createdBy: string;
}

export interface SalesReport {
  totalSalesAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  totalBillsCount: number;
  items: {
    content: SalesReportItem[];
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface PurchaseReportItem {
  id: number;
  purchaseNumber: string;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  supplierId?: number;
  supplierName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  createdBy: string;
}

export interface PurchaseReport {
  totalPurchasesAmount: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  totalInvoicesCount: number;
  items: {
    content: PurchaseReportItem[];
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface ExpenseReportItem {
  id: number;
  voucherNumber: string;
  expenseDate: string;
  categoryId?: number;
  categoryName: string;
  recipientName?: string;
  referenceNumber?: string;
  notes?: string;
  amount: number;
  paymentMode: PaymentMode;
  createdBy: string;
}

export interface ExpenseReport {
  totalExpenseAmount: number;
  totalVouchersCount: number;
  categoryBreakdown: Record<string, number>;
  items: {
    content: ExpenseReportItem[];
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface DailyProfitBreakdown {
  date: string;
  formattedDate: string;
  salesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPercentage: number;
}

export interface BasicProfitReport {
  startDate: string;
  endDate: string;
  totalSalesRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercentage: number;
  totalOperatingExpenses: number;
  basicNetProfit: number;
  netMarginPercentage: number;
  dailyBreakdowns: DailyProfitBreakdown[];
}

export interface CategoryStockDistribution {
  categoryId: number;
  categoryName: string;
  medicineCount: number;
  batchCount: number;
  stockUnits: number;
  purchaseValue: number;
  mrpValue: number;
}

export interface StockSummaryReport {
  totalMedicines: number;
  totalBatches: number;
  totalStockUnits: number;
  totalPurchaseValue: number;
  totalMrpValue: number;
  potentialMargin: number;
  lowStockCount: number;
  expiringWithin30DaysCount: number;
  expiringWithin90DaysCount: number;
  expiredBatchesCount: number;
  categoryDistribution: CategoryStockDistribution[];
}

export interface DetailedStockItem {
  medicineId: number;
  medicineName: string;
  genericName?: string;
  categoryName: string;
  manufacturerName: string;
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  purchaseValue: number;
  mrpValue: number;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  expiryStatus: 'NORMAL' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface LowStockReportItem {
  medicineId: number;
  medicineName: string;
  genericName?: string;
  categoryName: string;
  manufacturerName: string;
  unit: string;
  packSize?: string;
  minimumStock: number;
  currentStock: number;
  deficit: number;
  stockStatus: 'LOW_STOCK' | 'OUT_OF_STOCK';
  suggestedReorderQuantity: number;
}

export interface ExpiryReportItem {
  batchId: number;
  medicineId: number;
  medicineName: string;
  genericName?: string;
  categoryName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  mrp: number;
  totalAtRiskPurchaseValue: number;
  daysUntilExpiry: number;
  expiryStatus: 'EXPIRED' | 'EXPIRING_30' | 'EXPIRING_60' | 'EXPIRING_90' | 'NORMAL';
}

export interface CustomerOutstandingReportItem {
  customerId: number;
  customerName: string;
  phone?: string;
  doctorName?: string;
  totalBillsCount: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface SupplierOutstandingReportItem {
  supplierId: number;
  supplierName: string;
  phone?: string;
  contactPerson?: string;
  gstNumber?: string;
  totalPurchasesCount: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

export type ReportType =
  | 'sales'
  | 'purchases'
  | 'expenses'
  | 'profit'
  | 'stock_summary'
  | 'stock_detailed'
  | 'low_stock'
  | 'expiry'
  | 'customer_outstanding'
  | 'supplier_outstanding';
