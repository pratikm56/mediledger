import api from './api';
import type { ApiResponse } from '../types/auth';
import type { PageResponse } from '../types/medicine';
import type { 
  Expense, 
  ExpenseCategory, 
  CreateExpenseRequest, 
  CreateExpenseCategoryRequest, 
  FinancialCashFlowSummary 
} from '../types/expense';

export const expenseService = {
  getActiveCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get<ApiResponse<ExpenseCategory[]>>('/expenses/categories');
    return response.data.data;
  },

  createCategory: async (data: CreateExpenseCategoryRequest): Promise<ExpenseCategory> => {
    const response = await api.post<ApiResponse<ExpenseCategory>>('/expenses/categories', data);
    return response.data.data;
  },

  searchExpenses: async (
    query?: string,
    categoryId?: number,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Expense>> => {
    const response = await api.get<ApiResponse<PageResponse<Expense>>>('/expenses', {
      params: {
        query: query || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size,
      },
    });
    return response.data.data;
  },

  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return response.data.data;
  },

  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await api.post<ApiResponse<Expense>>('/expenses', data);
    return response.data.data;
  },

  getCashFlowSummary: async (): Promise<FinancialCashFlowSummary> => {
    const response = await api.get<ApiResponse<FinancialCashFlowSummary>>('/expenses/cash-flow');
    return response.data.data;
  },
};
