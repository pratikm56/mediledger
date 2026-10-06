import api from './api';
import type { ApiResponse } from '../types/auth';
import type { CreateMedicineData, Medicine, PageResponse, UpdateMedicineData } from '../types/medicine';

export interface MedicineSearchParams {
  query?: string;
  categoryId?: number;
  manufacturerId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const medicineService = {
  searchMedicines: async (params: MedicineSearchParams = {}): Promise<PageResponse<Medicine>> => {
    const response = await api.get<ApiResponse<PageResponse<Medicine>>>('/medicines', {
      params: {
        query: params.query || undefined,
        categoryId: params.categoryId || undefined,
        manufacturerId: params.manufacturerId || undefined,
        activeOnly: params.activeOnly ?? undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'name,asc',
      },
    });
    return response.data.data;
  },

  getAllActiveMedicines: async (): Promise<Medicine[]> => {
    const response = await api.get<ApiResponse<Medicine[]>>('/medicines/all-active');
    return response.data.data;
  },

  getMedicineById: async (id: number): Promise<Medicine> => {
    const response = await api.get<ApiResponse<Medicine>>(`/medicines/${id}`);
    return response.data.data;
  },

  createMedicine: async (data: CreateMedicineData): Promise<Medicine> => {
    const response = await api.post<ApiResponse<Medicine>>('/medicines', data);
    return response.data.data;
  },

  updateMedicine: async (id: number, data: UpdateMedicineData): Promise<Medicine> => {
    const response = await api.put<ApiResponse<Medicine>>(`/medicines/${id}`, data);
    return response.data.data;
  },

  toggleMedicineStatus: async (id: number): Promise<Medicine> => {
    const response = await api.patch<ApiResponse<Medicine>>(`/medicines/${id}/toggle-status`);
    return response.data.data;
  },
};
