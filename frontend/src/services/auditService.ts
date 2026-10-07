import api from './api';
import type { AuditLogResponse } from '../types/audit';

export const auditService = {
  getLogs: async (params?: Record<string, unknown>): Promise<AuditLogResponse> => {
    const res = await api.get('/audit-logs', { params });
    return res.data.data;
  },

  downloadCsv: async (params?: Record<string, unknown>): Promise<void> => {
    const res = await api.get('/audit-logs/export/csv', {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit_logs_report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
