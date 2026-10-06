import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  Purchase, 
  CreatePurchaseRequest, 
  PurchaseSummary, 
  PaymentStatus 
} from '../types/purchase';

export const purchaseService = {
  searchPurchases: async (
    query?: string,
    supplierId?: number,
    status?: PaymentStatus,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Purchase>> => {
    const response = await api.get<ApiResponse<PageResponse<Purchase>>>('/purchases', {
      params: {
        query: query || undefined,
        supplierId: supplierId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size,
      },
    });
    return response.data.data;
  },

  getPurchaseSummary: async (): Promise<PurchaseSummary> => {
    const response = await api.get<ApiResponse<PurchaseSummary>>('/purchases/summary');
    return response.data.data;
  },

  getPurchaseById: async (id: number): Promise<Purchase> => {
    const response = await api.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return response.data.data;
  },

  createPurchase: async (data: CreatePurchaseRequest): Promise<Purchase> => {
    const response = await api.post<ApiResponse<Purchase>>('/purchases', data);
    return response.data.data;
  },
};
