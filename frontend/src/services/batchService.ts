import api from './api';
import type { ApiResponse } from '../types/auth';
import type { 
  MedicineBatch, 
  CreateMedicineBatchRequest, 
  UpdateMedicineBatchRequest 
} from '../types/inventory';

export const batchService = {
  createBatch: async (data: CreateMedicineBatchRequest): Promise<MedicineBatch> => {
    const response = await api.post<ApiResponse<MedicineBatch>>('/batches', data);
    return response.data.data;
  },

  updateBatch: async (id: number, data: UpdateMedicineBatchRequest): Promise<MedicineBatch> => {
    const response = await api.put<ApiResponse<MedicineBatch>>(`/batches/${id}`, data);
    return response.data.data;
  },

  getBatchById: async (id: number): Promise<MedicineBatch> => {
    const response = await api.get<ApiResponse<MedicineBatch>>(`/batches/${id}`);
    return response.data.data;
  },

  getBatchesByMedicine: async (medicineId: number): Promise<MedicineBatch[]> => {
    const response = await api.get<ApiResponse<MedicineBatch[]>>(`/batches/medicine/${medicineId}`);
    return response.data.data;
  },

  getAvailableBatchesForSale: async (medicineId: number): Promise<MedicineBatch[]> => {
    const response = await api.get<ApiResponse<MedicineBatch[]>>(`/batches/medicine/${medicineId}/available-for-sale`);
    return response.data.data;
  },
};
