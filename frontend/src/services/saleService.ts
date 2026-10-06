import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  Sale, 
  CreateSaleRequest, 
  SaleSummary 
} from '../types/sale';
import type { PaymentStatus } from '../types/purchase';

export const saleService = {
  searchSales: async (
    query?: string,
    customerId?: number,
    status?: PaymentStatus,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Sale>> => {
    const response = await api.get<ApiResponse<PageResponse<Sale>>>('/sales', {
      params: {
        query: query || undefined,
        customerId: customerId || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size,
      },
    });
    return response.data.data;
  },

  getSaleSummary: async (): Promise<SaleSummary> => {
    const response = await api.get<ApiResponse<SaleSummary>>('/sales/summary');
    return response.data.data;
  },

  getSaleById: async (id: number): Promise<Sale> => {
    const response = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
    return response.data.data;
  },

  getSaleByInvoiceNumber: async (invoiceNumber: string): Promise<Sale> => {
    const response = await api.get<ApiResponse<Sale>>(`/sales/invoice/${invoiceNumber}`);
    return response.data.data;
  },

  createSale: async (data: CreateSaleRequest): Promise<Sale> => {
    const response = await api.post<ApiResponse<Sale>>('/sales', data);
    return response.data.data;
  },
};
