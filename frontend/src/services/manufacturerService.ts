import api from './api';
import type { ApiResponse } from '../types/auth';
import type { CreateManufacturerData, Manufacturer, PageResponse } from '../types/medicine';

export const manufacturerService = {
  getManufacturers: async (includeInactive = false): Promise<Manufacturer[]> => {
    const response = await api.get<ApiResponse<Manufacturer[]>>('/manufacturers', {
      params: { includeInactive },
    });
    return response.data.data;
  },

  searchManufacturers: async (
    query?: string,
    activeOnly?: boolean,
    page = 0,
    size = 20
  ): Promise<PageResponse<Manufacturer>> => {
    const response = await api.get<ApiResponse<PageResponse<Manufacturer>>>('/manufacturers/search', {
      params: { query, activeOnly, page, size },
    });
    return response.data.data;
  },

  getManufacturerById: async (id: number): Promise<Manufacturer> => {
    const response = await api.get<ApiResponse<Manufacturer>>(`/manufacturers/${id}`);
    return response.data.data;
  },

  createManufacturer: async (data: CreateManufacturerData): Promise<Manufacturer> => {
    const response = await api.post<ApiResponse<Manufacturer>>('/manufacturers', data);
    return response.data.data;
  },

  updateManufacturer: async (id: number, data: CreateManufacturerData): Promise<Manufacturer> => {
    const response = await api.put<ApiResponse<Manufacturer>>(`/manufacturers/${id}`, data);
    return response.data.data;
  },

  toggleManufacturerStatus: async (id: number): Promise<Manufacturer> => {
    const response = await api.patch<ApiResponse<Manufacturer>>(`/manufacturers/${id}/toggle-status`);
    return response.data.data;
  },
};
