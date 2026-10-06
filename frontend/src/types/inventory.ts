export type StockTransactionType = 
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGED'
  | 'EXPIRED';

export interface MedicineBatch {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  quantity: number;
  expired: boolean;
  daysUntilExpiry: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  transactionType: StockTransactionType;
  quantityChange: number;
  quantityAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface InventorySummary {
  totalInventoryUnits: number;
  totalPurchaseValuation: number;
  totalSellingValuation: number;
  lowStockCount: number;
  expiringWithin30DaysCount: number;
  expiredBatchesCount: number;
}

export interface MedicineStock {
  medicineId: number;
  medicineName: string;
  genericName?: string;
  categoryId: number;
  categoryName: string;
  manufacturerId?: number;
  manufacturerName?: string;
  unit: string;
  packSize?: string;
  minimumStock: number;
  currentStock: number;
  lowStock: boolean;
  batchCount: number;
  batches: MedicineBatch[];
}

export interface CreateMedicineBatchRequest {
  medicineId: number;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  initialQuantity: number;
}

export interface UpdateMedicineBatchRequest {
  manufacturingDate?: string;
  expiryDate: string;
  purchasePrice: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
}

export interface StockAdjustmentRequest {
  batchId: number;
  transactionType: StockTransactionType;
  quantityChange: number;
  reason: string;
  referenceId?: string;
}
