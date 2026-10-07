import api from './api';
import type { DashboardSummary, DashboardTrendItem, DashboardAlerts } from '../types/dashboard';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },

  getTrends: async (days: number = 7): Promise<DashboardTrendItem[]> => {
    const response = await api.get('/dashboard/trends', { params: { days } });
    return response.data.data;
  },

  getAlerts: async (): Promise<DashboardAlerts> => {
    const response = await api.get('/dashboard/alerts');
    return response.data.data;
  },
};
