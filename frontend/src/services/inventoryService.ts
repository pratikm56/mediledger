import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  InventorySummary, 
  MedicineBatch, 
  MedicineStock, 
  StockAdjustmentRequest, 
  StockTransaction, 
  StockTransactionType 
} from '../types/inventory';

export interface StockOverviewParams {
  query?: string;
  categoryId?: number;
  lowStockOnly?: boolean;
  page?: number;
  size?: number;
}

export interface StockTransactionParams {
  medicineId?: number;
  batchId?: number;
  type?: StockTransactionType;
  page?: number;
  size?: number;
}

export const inventoryService = {
  getSummary: async (): Promise<InventorySummary> => {
    const response = await api.get<ApiResponse<InventorySummary>>('/inventory/summary');
    return response.data.data;
  },

  getStockOverview: async (params: StockOverviewParams = {}): Promise<PageResponse<MedicineStock>> => {
    const response = await api.get<ApiResponse<PageResponse<MedicineStock>>>('/inventory/stock-overview', {
      params: {
        query: params.query || undefined,
        categoryId: params.categoryId || undefined,
        lowStockOnly: params.lowStockOnly || undefined,
        page: params.page ?? 0,
        size: params.size ?? 15,
      },
    });
    return response.data.data;
  },

  getExpiringBatches: async (days = 30, page = 0, size = 15): Promise<PageResponse<MedicineBatch>> => {
    const response = await api.get<ApiResponse<PageResponse<MedicineBatch>>>('/inventory/expiring', {
      params: { days, page, size },
    });
    return response.data.data;
  },

  getExpiredBatches: async (page = 0, size = 15): Promise<PageResponse<MedicineBatch>> => {
    const response = await api.get<ApiResponse<PageResponse<MedicineBatch>>>('/inventory/expired', {
      params: { page, size },
    });
    return response.data.data;
  },

  getStockTransactions: async (params: StockTransactionParams = {}): Promise<PageResponse<StockTransaction>> => {
    const response = await api.get<ApiResponse<PageResponse<StockTransaction>>>('/inventory/transactions', {
      params: {
        medicineId: params.medicineId || undefined,
        batchId: params.batchId || undefined,
        type: params.type || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return response.data.data;
  },

  adjustStock: async (data: StockAdjustmentRequest): Promise<StockTransaction> => {
    const response = await api.post<ApiResponse<StockTransaction>>('/inventory/adjust', data);
    return response.data.data;
  },
};
