import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  Customer, 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerOutstandingSummary 
} from '../types/partner';

export const customerService = {
  searchCustomers: async (
    query?: string,
    activeOnly?: boolean,
    page = 0,
    size = 20
  ): Promise<PageResponse<Customer>> => {
    const response = await api.get<ApiResponse<PageResponse<Customer>>>('/customers', {
      params: { query: query || undefined, activeOnly: activeOnly ?? undefined, page, size },
    });
    return response.data.data;
  },

  getActiveCustomers: async (): Promise<Customer[]> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers/all-active');
    return response.data.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  getCustomerByPhone: async (phone: string): Promise<Customer> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/phone/${phone}`);
    return response.data.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  updateCustomer: async (id: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  toggleCustomerStatus: async (id: number): Promise<Customer> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/toggle-status`);
    return response.data.data;
  },

  getCustomersWithOutstanding: async (page = 0, size = 20): Promise<PageResponse<Customer>> => {
    const response = await api.get<ApiResponse<PageResponse<Customer>>>('/customers/outstanding', {
      params: { page, size },
    });
    return response.data.data;
  },

  getOutstandingSummary: async (): Promise<CustomerOutstandingSummary> => {
    const response = await api.get<ApiResponse<CustomerOutstandingSummary>>('/customers/outstanding-summary');
    return response.data.data;
  },
};
