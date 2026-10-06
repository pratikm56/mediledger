import type { PaymentMode, PaymentStatus } from './purchase';

export interface SaleItem {
  id: number;
  medicineId: number;
  medicineName?: string;
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  purchasePrice: number;
  gstPercentage: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  roundOff: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: SaleItem[];
}

export interface CreateSaleItemRequest {
  medicineId: number;
  batchId: number;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface CreateSaleRequest {
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  saleDate: string;
  paymentMode: PaymentMode;
  paidAmount?: number;
  discountAmount?: number;
  roundOff?: number;
  notes?: string;
  items: CreateSaleItemRequest[];
}

export interface SaleSummary {
  totalSalesCount: number;
  totalSalesAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  todaySalesCount: number;
  todaySalesAmount: number;
  unpaidSalesCount: number;
}
