import api from './api';
import type { ApiResponse } from '../types/auth';
import type { Category, CreateCategoryData } from '../types/medicine';

export const categoryService = {
  getCategories: async (includeInactive = false): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories', {
      params: { includeInactive },
    });
    return response.data.data;
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: CreateCategoryData): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  toggleCategoryStatus: async (id: number): Promise<Category> => {
    const response = await api.patch<ApiResponse<Category>>(`/categories/${id}/toggle-status`);
    return response.data.data;
  },
};
