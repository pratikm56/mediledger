import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseService } from '../services/expenseService';
import { paymentService } from '../services/paymentService';
import { customerService } from '../services/customerService';
import { supplierService } from '../services/supplierService';
import type { Customer, Supplier } from '../types/partner';
import type { 
  Expense, 
  ExpenseCategory, 
  CreateExpenseRequest, 
  Payment, 
  CreatePaymentRequest, 
  PaymentType, 
  FinancialCashFlowSummary 
} from '../types/expense';
import type { PaymentMode } from '../types/purchase';
import { 
  DollarSign, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  CreditCard,
  Building2,
  Calendar,
  Users,
  Wallet,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Tag
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;

  const [activeTab, setActiveTab] = useState<'expenses' | 'payments'>('expenses');

  // Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashFlow, setCashFlow] = useState<FinancialCashFlowSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals & Feedback
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState<CreateExpenseRequest>({
    categoryId: 0,
    expenseDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'CASH',
    recipientName: '',
    referenceNumber: '',
    notes: '',
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>('');

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState<CreatePaymentRequest>({
    paymentType: 'CUSTOMER_RECEIPT',
    customerId: undefined,
    supplierId: undefined,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'CASH',
    referenceNumber: '',
    notes: '',
  });

  const loadReferences = async () => {
    try {
      const [catList, custList, suppList, flow] = await Promise.all([
        expenseService.getActiveCategories(),
        customerService.getActiveCustomers(),
        supplierService.getActiveSuppliers(),
        expenseService.getCashFlowSummary().catch(() => null),
      ]);
      setCategories(catList);
      setCustomers(custList);
      setSuppliers(suppList);
      if (flow) setCashFlow(flow);
    } catch (err: any) {
      console.error('Failed to load references', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const catId = selectedCategoryId ? Number(selectedCategoryId) : undefined;
      const data = await expenseService.searchExpenses(
        searchQuery,
        catId,
        startDate || undefined,
        endDate || undefined,
        0,
        50
      );
      setExpenses(data.content);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const typeParam = paymentTypeFilter === 'ALL' ? undefined : (paymentTypeFilter as PaymentType);
      const data = await paymentService.searchPayments(
        typeParam,
        undefined,
        undefined,
        startDate || undefined,
        endDate || undefined,
        0,
        50
      );
      setPayments(data.content);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    } else {
      fetchPayments();
    }
  }, [activeTab, searchQuery, selectedCategoryId, paymentTypeFilter, startDate, endDate]);

  const handleOpenExpenseModal = () => {
    setExpenseForm({
      categoryId: categories.length > 0 ? categories[0].id : 0,
      expenseDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMode: 'CASH',
      recipientName: '',
      referenceNumber: '',
      notes: '',
    });
    setErrorMessage(null);
    setShowExpenseModal(true);
  };

  const handleOpenPaymentModal = (defaultType: PaymentType = 'CUSTOMER_RECEIPT') => {
    setPaymentForm({
      paymentType: defaultType,
      customerId: defaultType === 'CUSTOMER_RECEIPT' && customers.length > 0 ? customers[0].id : undefined,
      supplierId: defaultType === 'SUPPLIER_PAYMENT' && suppliers.length > 0 ? suppliers[0].id : undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMode: 'CASH',
      referenceNumber: '',
      notes: '',
    });
    setErrorMessage(null);
    setShowPaymentModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (!expenseForm.categoryId) {
        throw new Error('Please select an expense category');
      }
      if (Number(expenseForm.amount) <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const created = await expenseService.createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });

      setSuccessMessage(`Expense voucher "${created.voucherNumber}" for ₹${created.amount} recorded!`);
      setShowExpenseModal(false);
      fetchExpenses();
      loadReferences();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to book expense');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (!newCategoryName.trim()) {
        throw new Error('Category name is required');
      }

      const created = await expenseService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });

      setCategories((prev) => [...prev, created]);
      setSuccessMessage(`Expense category "${created.name}" created!`);
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (paymentForm.paymentType === 'CUSTOMER_RECEIPT' && !paymentForm.customerId) {
        throw new Error('Please select a customer');
      }
      if (paymentForm.paymentType === 'SUPPLIER_PAYMENT' && !paymentForm.supplierId) {
        throw new Error('Please select a supplier');
      }
      if (Number(paymentForm.amount) <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const created = await paymentService.createPayment({
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });

      setSuccessMessage(`Payment record "${created.receiptNumber}" for ₹${created.amount} settled successfully!`);
      setShowPaymentModal(false);
      fetchPayments();
      loadReferences();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-amber-600" />
            <span>Expenses &amp; Financial Cash Flow</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track daily pharmacy operational expenditures, customer credit receipts, and supplier disbursements
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Shop Expenses</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'payments'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Dues &amp; Receipts</span>
            </button>
          </div>

          <button
            onClick={() => {
              loadReferences();
              if (activeTab === 'expenses') fetchExpenses();
              else fetchPayments();
            }}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'expenses' ? (
            <button
              onClick={handleOpenExpenseModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleOpenPaymentModal('CUSTOMER_RECEIPT')}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Receive Customer Due</span>
              </button>
              <button
                onClick={() => handleOpenPaymentModal('SUPPLIER_PAYMENT')}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Pay Supplier</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Financial Cash Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Operational Expenses</span>
            <span className="text-lg font-bold text-slate-900">
              ₹{(cashFlow?.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Customer Dues Recovered</span>
            <span className="text-lg font-bold text-emerald-600">
              ₹{(cashFlow?.totalCustomerReceipts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Supplier Payables Paid</span>
            <span className="text-lg font-bold text-rose-600">
              ₹{(cashFlow?.totalSupplierPayments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Net Settlement Liquidity</span>
            <span className={`text-lg font-bold ${(cashFlow?.netCashFlow || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              ₹{(cashFlow?.netCashFlow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1: Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher #, recipient, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>New Category</span>
                </button>
              )}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher # &amp; Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To (Recipient)</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Reference # / Notes</th>
                    <th className="py-3 px-4 text-right">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading expense vouchers...</span>
                        </div>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{exp.voucherNumber}</span>
                          <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                            <Calendar className="w-3 h-3" />
                            <span>{exp.expenseDate}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            {exp.categoryName}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {exp.recipientName || '—'}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          ₹{exp.amount.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {exp.paymentMode}
                        </td>

                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {exp.referenceNumber && (
                            <span className="font-mono text-[10px] text-slate-600 block">Ref: {exp.referenceNumber}</span>
                          )}
                          <span>{exp.notes || '—'}</span>
                        </td>

                        <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                          {exp.createdBy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments (Receipts & Disbursements) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-700"
              >
                <option value="ALL">All Settlement Transactions</option>
                <option value="CUSTOMER_RECEIPT">Customer Dues Received</option>
                <option value="SUPPLIER_PAYMENT">Supplier Dues Paid</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt # &amp; Date</th>
                    <th className="py-3 px-4">Transaction Type</th>
                    <th className="py-3 px-4">Party Account (Customer / Vendor)</th>
                    <th className="py-3 px-4">Settled Amount</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Reference &amp; Notes</th>
                    <th className="py-3 px-4 text-right">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading settlement ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No payment or settlement records found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isReceipt = p.paymentType === 'CUSTOMER_RECEIPT';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{p.receiptNumber}</span>
                            <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                              <Calendar className="w-3 h-3" />
                              <span>{p.paymentDate}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isReceipt ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>CUSTOMER RECEIPT</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>SUPPLIER PAYMENT</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isReceipt ? (
                              <div className="flex items-center space-x-1.5">
                                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-bold text-slate-900">{p.customerName || 'Customer'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span className="font-bold text-slate-900">{p.supplierName || 'Supplier'}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold">
                            <span className={isReceipt ? 'text-emerald-700' : 'text-rose-700'}>
                              {isReceipt ? '+' : '-'}₹{p.amount.toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-700">
                            {p.paymentMode}
                          </td>

                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {p.referenceNumber && (
                              <span className="font-mono text-[10px] text-slate-600 block">Ref: {p.referenceNumber}</span>
                            )}
                            <span>{p.notes || '—'}</span>
                          </td>

                          <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                            {p.createdBy}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Record Operational Expense</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value={0}>-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    required
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid To / Recipient</label>
                  <input
                    type="text"
                    placeholder="Person or vendor name"
                    value={expenseForm.recipientName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, recipientName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference / Bill / Cheque #</label>
                <input
                  type="text"
                  placeholder="e.g. EB-Bill-48902 or Cheque #120"
                  value={expenseForm.referenceNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Voucher</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Expense Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Chemicals &amp; Reagents"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief details"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment / Settlement Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${paymentForm.paymentType === 'CUSTOMER_RECEIPT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {paymentForm.paymentType === 'CUSTOMER_RECEIPT' ? 'Receive Customer Credit Payment' : 'Pay Supplier Outstanding Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'CUSTOMER_RECEIPT', supplierId: undefined })}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                      paymentForm.paymentType === 'CUSTOMER_RECEIPT'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Customer Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'SUPPLIER_PAYMENT', customerId: undefined })}
                    className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-colors ${
                      paymentForm.paymentType === 'SUPPLIER_PAYMENT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Supplier Payment
                  </button>
                </div>
              </div>

              {paymentForm.paymentType === 'CUSTOMER_RECEIPT' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentForm.customerId || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, customerId: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Due: ₹{c.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplier Distributor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentForm.supplierId || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, supplierId: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: ₹{s.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    required
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/10294 or CHQ#9901"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Narration</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cleared bill #4092"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={`py-2 px-3 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 ${
                    paymentForm.paymentType === 'CUSTOMER_RECEIPT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Record &amp; Settle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
