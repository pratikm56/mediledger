import api from './api';
import type {
  SalesReport,
  PurchaseReport,
  ExpenseReport,
  BasicProfitReport,
  StockSummaryReport,
  DetailedStockItem,
  LowStockReportItem,
  ExpiryReportItem,
  CustomerOutstandingReportItem,
  SupplierOutstandingReportItem,
  ReportType
} from '../types/report';

export const reportService = {
  getSalesReport: async (params?: Record<string, unknown>): Promise<SalesReport> => {
    const res = await api.get('/reports/sales', { params });
    return res.data.data;
  },

  getPurchaseReport: async (params?: Record<string, unknown>): Promise<PurchaseReport> => {
    const res = await api.get('/reports/purchases', { params });
    return res.data.data;
  },

  getExpenseReport: async (params?: Record<string, unknown>): Promise<ExpenseReport> => {
    const res = await api.get('/reports/expenses', { params });
    return res.data.data;
  },

  getProfitReport: async (startDate?: string, endDate?: string): Promise<BasicProfitReport> => {
    const res = await api.get('/reports/profit', { params: { startDate, endDate } });
    return res.data.data;
  },

  getStockSummaryReport: async (): Promise<StockSummaryReport> => {
    const res = await api.get('/reports/stock-summary');
    return res.data.data;
  },

  getDetailedStockReport: async (params?: Record<string, unknown>): Promise<{ content: DetailedStockItem[]; totalElements: number; totalPages: number }> => {
    const res = await api.get('/reports/stock-detailed', { params });
    return res.data.data;
  },

  getLowStockReport: async (params?: Record<string, unknown>): Promise<{ content: LowStockReportItem[]; totalElements: number; totalPages: number }> => {
    const res = await api.get('/reports/low-stock', { params });
    return res.data.data;
  },

  getExpiryReport: async (params?: Record<string, unknown>): Promise<{ content: ExpiryReportItem[]; totalElements: number; totalPages: number }> => {
    const res = await api.get('/reports/expiry', { params });
    return res.data.data;
  },

  getCustomerOutstandingReport: async (params?: Record<string, unknown>): Promise<{ content: CustomerOutstandingReportItem[]; totalElements: number; totalPages: number }> => {
    const res = await api.get('/reports/customer-outstanding', { params });
    return res.data.data;
  },

  getSupplierOutstandingReport: async (params?: Record<string, unknown>): Promise<{ content: SupplierOutstandingReportItem[]; totalElements: number; totalPages: number }> => {
    const res = await api.get('/reports/supplier-outstanding', { params });
    return res.data.data;
  },

  downloadCsv: async (reportType: ReportType, params?: Record<string, unknown>): Promise<void> => {
    const res = await api.get(`/reports/export/csv/${reportType}`, {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
