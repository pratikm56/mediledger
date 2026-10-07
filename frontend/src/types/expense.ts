import type { PaymentMode } from './purchase';

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string;
}

export interface Expense {
  id: number;
  voucherNumber: string;
  categoryId: number;
  categoryName: string;
  expenseDate: string;
  amount: number;
  paymentMode: PaymentMode;
  recipientName?: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  categoryId: number;
  expenseDate: string;
  amount: number;
  paymentMode: PaymentMode;
  recipientName?: string;
  referenceNumber?: string;
  notes?: string;
}

export type PaymentType = 'CUSTOMER_RECEIPT' | 'SUPPLIER_PAYMENT';

export interface Payment {
  id: number;
  receiptNumber: string;
  paymentType: PaymentType;
  customerId?: number;
  customerName?: string;
  supplierId?: number;
  supplierName?: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  paymentType: PaymentType;
  customerId?: number;
  supplierId?: number;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
}

export interface FinancialCashFlowSummary {
  totalExpenses: number;
  todayExpenses: number;
  totalCustomerReceipts: number;
  todayCustomerReceipts: number;
  totalSupplierPayments: number;
  todaySupplierPayments: number;
  netCashFlow: number;
}
