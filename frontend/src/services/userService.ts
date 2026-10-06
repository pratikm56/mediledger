import api from './api';
import type { ApiResponse, CreateUserData, UpdateUserData, User } from '../types/auth';

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  changePassword: async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    await api.post(`/users/${id}/change-password`, {
      currentPassword,
      newPassword,
    });
  },
};
