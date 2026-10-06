import api from './api';
import type { ApiResponse, LoginResponse, User } from '../types/auth';

export const authService = {
  login: async (usernameOrEmail: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      usernameOrEmail,
      password,
    });
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('mediledger_token');
      localStorage.removeItem('mediledger_user');
    }
  },
};
