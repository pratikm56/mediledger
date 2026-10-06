export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';

export interface PurchaseItem {
  id: number;
  medicineId: number;
  medicineName?: string;
  batchId?: number;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: number;
  supplierName: string;
  purchaseDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface CreatePurchaseItemRequest {
  medicineId: number;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string;
  quantity: number;
  freeQuantity: number;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
}

export interface CreatePurchaseRequest {
  supplierId: number;
  supplierInvoiceNumber?: string;
  purchaseDate: string;
  paymentMode: PaymentMode;
  paidAmount?: number;
  discountAmount?: number;
  notes?: string;
  items: CreatePurchaseItemRequest[];
}

export interface PurchaseSummary {
  totalPurchasesCount: number;
  totalPurchasesAmount: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  pendingBillsCount: number;
}
