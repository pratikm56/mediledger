import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { Payment, CreatePaymentRequest, PaymentType } from '../types/expense';

export const paymentService = {
  searchPayments: async (
    type?: PaymentType,
    customerId?: number,
    supplierId?: number,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Payment>> => {
    const response = await api.get<ApiResponse<PageResponse<Payment>>>('/payments', {
      params: {
        type: type || undefined,
        customerId: customerId || undefined,
        supplierId: supplierId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size,
      },
    });
    return response.data.data;
  },

  getPaymentById: async (id: number): Promise<Payment> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data.data;
  },

  createPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>('/payments', data);
    return response.data.data;
  },
};
