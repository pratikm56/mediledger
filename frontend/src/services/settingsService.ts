import api from './api';
import type { BusinessSettingsMap, UpdateBusinessSettingsRequest } from '../types/settings';

export const settingsService = {
  getSettings: async (): Promise<BusinessSettingsMap> => {
    const res = await api.get('/settings');
    return res.data.data;
  },

  updateSettings: async (request: UpdateBusinessSettingsRequest): Promise<BusinessSettingsMap> => {
    const res = await api.put('/settings', request);
    return res.data.data;
  }
};
