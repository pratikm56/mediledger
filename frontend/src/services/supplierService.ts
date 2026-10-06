import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  Supplier, 
  CreateSupplierRequest, 
  UpdateSupplierRequest, 
  SupplierOutstandingSummary 
} from '../types/partner';

export const supplierService = {
  searchSuppliers: async (
    query?: string,
    activeOnly?: boolean,
    page = 0,
    size = 20
  ): Promise<PageResponse<Supplier>> => {
    const response = await api.get<ApiResponse<PageResponse<Supplier>>>('/suppliers', {
      params: { query: query || undefined, activeOnly: activeOnly ?? undefined, page, size },
    });
    return response.data.data;
  },

  getActiveSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<ApiResponse<Supplier[]>>('/suppliers/all-active');
    return response.data.data;
  },

  getSupplierById: async (id: number): Promise<Supplier> => {
    const response = await api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data.data;
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
    return response.data.data;
  },

  updateSupplier: async (id: number, data: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  toggleSupplierStatus: async (id: number): Promise<Supplier> => {
    const response = await api.patch<ApiResponse<Supplier>>(`/suppliers/${id}/toggle-status`);
    return response.data.data;
  },

  getSuppliersWithOutstanding: async (page = 0, size = 20): Promise<PageResponse<Supplier>> => {
    const response = await api.get<ApiResponse<PageResponse<Supplier>>>('/suppliers/outstanding', {
      params: { page, size },
    });
    return response.data.data;
  },

  getOutstandingSummary: async (): Promise<SupplierOutstandingSummary> => {
    const response = await api.get<ApiResponse<SupplierOutstandingSummary>>('/suppliers/outstanding-summary');
    return response.data.data;
  },
};
