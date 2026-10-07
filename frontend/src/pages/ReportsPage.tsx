import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import type {
  ReportType,
  SalesReport,
  PurchaseReport,
  ExpenseReport,
  BasicProfitReport,
  StockSummaryReport,
  DetailedStockItem,
  LowStockReportItem,
  ExpiryReportItem,
  CustomerOutstandingReportItem,
  SupplierOutstandingReportItem
} from '../types/report';
import {
  FileText,
  Download,
  Search,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Truck,
  Receipt,
  AlertTriangle,
  AlertCircle,
  Users,
  Building2,
  Package,
  Layers
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const hasFullAccess = isOwner || isAdmin;

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<ReportType>(hasFullAccess ? 'sales' : 'stock_summary');

  // Filter States
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(20);

  // Expiry window filter
  const [expiryWindow, setExpiryWindow] = useState<string>('ALL_AT_RISK');

  // Data States
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [purchaseData, setPurchaseData] = useState<PurchaseReport | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseReport | null>(null);
  const [profitData, setProfitData] = useState<BasicProfitReport | null>(null);
  const [stockSummaryData, setStockSummaryData] = useState<StockSummaryReport | null>(null);
  const [detailedStockData, setDetailedStockData] = useState<{ content: DetailedStockItem[]; totalPages: number; totalElements: number } | null>(null);
  const [lowStockData, setLowStockData] = useState<{ content: LowStockReportItem[]; totalPages: number; totalElements: number } | null>(null);
  const [expiryData, setExpiryData] = useState<{ content: ExpiryReportItem[]; totalPages: number; totalElements: number } | null>(null);
  const [customerData, setCustomerData] = useState<{ content: CustomerOutstandingReportItem[]; totalPages: number; totalElements: number } | null>(null);
  const [supplierData, setSupplierData] = useState<{ content: SupplierOutstandingReportItem[]; totalPages: number; totalElements: number } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute preset dates
  const applyDatePreset = useCallback((preset: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const dStr = formatDate(today);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dStr = formatDate(yesterday);
      setStartDate(dStr);
      setEndDate(dStr);
    } else if (preset === 'week') {
      const start = new Date();
      start.setDate(today.getDate() - 6);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const start = new Date();
      start.setDate(today.getDate() - 29);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    }
  }, []);

  useEffect(() => {
    applyDatePreset('month');
  }, [applyDatePreset]);

  // Load report data
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseParams = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        query: searchQuery || undefined,
        page,
        size: pageSize
      };

      switch (activeTab) {
        case 'sales':
          setSalesData(await reportService.getSalesReport(baseParams));
          break;
        case 'purchases':
          setPurchaseData(await reportService.getPurchaseReport(baseParams));
          break;
        case 'expenses':
          setExpenseData(await reportService.getExpenseReport(baseParams));
          break;
        case 'profit':
          setProfitData(await reportService.getProfitReport(startDate, endDate));
          break;
        case 'stock_summary':
          setStockSummaryData(await reportService.getStockSummaryReport());
          break;
        case 'stock_detailed':
          setDetailedStockData(await reportService.getDetailedStockReport({ query: searchQuery, page, size: pageSize }));
          break;
        case 'low_stock':
          setLowStockData(await reportService.getLowStockReport({ query: searchQuery, page, size: pageSize }));
          break;
        case 'expiry':
          setExpiryData(await reportService.getExpiryReport({ window: expiryWindow, query: searchQuery, page, size: pageSize }));
          break;
        case 'customer_outstanding':
          setCustomerData(await reportService.getCustomerOutstandingReport({ query: searchQuery, page, size: pageSize }));
          break;
        case 'supplier_outstanding':
          setSupplierData(await reportService.getSupplierOutstandingReport({ query: searchQuery, page, size: pageSize }));
          break;
      }
    } catch (err: unknown) {
      console.error('Error fetching report', err);
      setError('Failed to generate report. Please verify connection and parameters.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, searchQuery, page, pageSize, expiryWindow]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloading(true);
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        query: searchQuery || undefined
      };
      await reportService.downloadCsv(activeTab, params);
    } catch (err: unknown) {
      console.error('CSV export failed', err);
      alert('Failed to export CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const showDateFilter = ['sales', 'purchases', 'expenses', 'profit'].includes(activeTab);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <FileText className="w-3.5 h-3.5" />
              <span>Pharmacy Audit &amp; Analytics Module</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">MediLedger Financial &amp; Inventory Reports</h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Comprehensive GST-ready sales, supplier invoices, operational expenses, profit margins, and batch valuation audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadReport()}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {hasFullAccess && (
              <button
                onClick={handleDownloadCsv}
                disabled={downloading || loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Type Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {hasFullAccess && (
            <>
              <button
                onClick={() => handleTabChange('sales')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'sales' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Sales Report</span>
              </button>

              <button
                onClick={() => handleTabChange('purchases')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'purchases' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Purchase Report</span>
              </button>

              <button
                onClick={() => handleTabChange('expenses')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Expense Report</span>
              </button>

              <button
                onClick={() => handleTabChange('profit')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'profit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Basic Profit</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleTabChange('stock_summary')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'stock_summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock Summary</span>
          </button>

          <button
            onClick={() => handleTabChange('stock_detailed')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'stock_detailed' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Detailed Stock</span>
          </button>

          <button
            onClick={() => handleTabChange('low_stock')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'low_stock' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Low Stock</span>
          </button>

          <button
            onClick={() => handleTabChange('expiry')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'expiry' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Expiry Report</span>
          </button>

          {hasFullAccess && (
            <>
              <button
                onClick={() => handleTabChange('customer_outstanding')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'customer_outstanding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customer Dues</span>
              </button>

              <button
                onClick={() => handleTabChange('supplier_outstanding')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'supplier_outstanding' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Supplier Dues</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {showDateFilter ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>Date:</span>
            </span>
            {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  datePreset === preset
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : preset}
              </button>
            ))}

            {datePreset === 'custom' && (
              <div className="flex items-center space-x-2 pl-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        ) : activeTab === 'expiry' ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Filter Window:</span>
            <select
              value={expiryWindow}
              onChange={(e) => setExpiryWindow(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL_AT_RISK">All At-Risk (&le; 90 Days + Expired)</option>
              <option value="EXPIRED">Expired Only</option>
              <option value="WITHIN_30">&le; 30 Days Left</option>
              <option value="WITHIN_60">31 - 60 Days Left</option>
              <option value="WITHIN_90">61 - 90 Days Left</option>
            </select>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-medium">
            Displaying live inventory database calculations
          </div>
        )}

        {activeTab !== 'stock_summary' && activeTab !== 'profit' && (
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search report records..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report KPI Summary Header Cards */}
      {activeTab === 'sales' && salesData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Sales</span>
            <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(salesData.totalSalesAmount)}</div>
            <span className="text-[10px] text-slate-500">{salesData.totalBillsCount} Invoices</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Discount</span>
            <div className="text-lg font-black text-amber-600 mt-1">{formatCurrency(salesData.totalDiscountAmount)}</div>
            <span className="text-[10px] text-slate-500">Subtotal Concessions</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">GST Tax Collected</span>
            <div className="text-lg font-black text-blue-600 mt-1">{formatCurrency(salesData.totalTaxAmount)}</div>
            <span className="text-[10px] text-slate-500">Output GST</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Paid</span>
            <div className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(salesData.totalPaidAmount)}</div>
            <span className="text-[10px] text-slate-500">Cash/UPI Collected</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Credit Outstanding</span>
            <div className="text-lg font-black text-rose-600 mt-1">{formatCurrency(salesData.totalBalanceAmount)}</div>
            <span className="text-[10px] text-slate-500">Unpaid Balances</span>
          </div>
        </div>
      )}

      {activeTab === 'purchases' && purchaseData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Purchases</span>
            <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(purchaseData.totalPurchasesAmount)}</div>
            <span className="text-[10px] text-slate-500">{purchaseData.totalInvoicesCount} Consignments</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">GST Input Tax</span>
            <div className="text-lg font-black text-blue-600 mt-1">{formatCurrency(purchaseData.totalTaxAmount)}</div>
            <span className="text-[10px] text-slate-500">Eligible Input Tax Credit</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Cleared</span>
            <div className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(purchaseData.totalPaidAmount)}</div>
            <span className="text-[10px] text-slate-500">Disbursed to Suppliers</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pending Payables</span>
            <div className="text-lg font-black text-amber-600 mt-1">{formatCurrency(purchaseData.totalBalanceAmount)}</div>
            <span className="text-[10px] text-slate-500">Outstanding Invoices</span>
          </div>
        </div>
      )}

      {activeTab === 'profit' && profitData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Sales Revenue</span>
            <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(profitData.totalSalesRevenue)}</div>
            <span className="text-[10px] text-slate-500">Total Invoiced Retail</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Cost of Goods (COGS)</span>
            <div className="text-lg font-black text-blue-600 mt-1">{formatCurrency(profitData.totalCostOfGoodsSold)}</div>
            <span className="text-[10px] text-slate-500">Batch Acquisition Cost</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Profit</span>
            <div className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(profitData.grossProfit)}</div>
            <span className="text-[10px] text-emerald-700 font-bold">{profitData.grossMarginPercentage}% Gross Margin</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Basic Net Profit</span>
            <div className={`text-lg font-black mt-1 ${profitData.basicNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(profitData.basicNetProfit)}
            </div>
            <span className="text-[10px] text-slate-500">After {formatCurrency(profitData.totalOperatingExpenses)} Expenses</span>
          </div>
        </div>
      )}

      {activeTab === 'stock_summary' && stockSummaryData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Stock Valuation (Cost)</span>
            <div className="text-lg font-black text-slate-900 mt-1">{formatCurrency(stockSummaryData.totalPurchaseValue)}</div>
            <span className="text-[10px] text-slate-500">{stockSummaryData.totalStockUnits.toLocaleString()} Total Units</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Stock Valuation (MRP)</span>
            <div className="text-lg font-black text-indigo-600 mt-1">{formatCurrency(stockSummaryData.totalMrpValue)}</div>
            <span className="text-[10px] text-indigo-700 font-bold">Margin: {formatCurrency(stockSummaryData.potentialMargin)}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Low Stock Alerts</span>
            <div className="text-lg font-black text-rose-600 mt-1">{stockSummaryData.lowStockCount}</div>
            <span className="text-[10px] text-rose-700 font-bold">Medicines at threshold</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Expired / Risk Batches</span>
            <div className="text-lg font-black text-amber-600 mt-1">
              {stockSummaryData.expiredBatchesCount} Expired
            </div>
            <span className="text-[10px] text-slate-500">{stockSummaryData.expiringWithin30DaysCount} Expiring &le; 30d</span>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Generating report records from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. SALES TABLE */}
            {activeTab === 'sales' && salesData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.items.content.length > 0 ? (
                    salesData.items.content.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{item.saleDate}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{item.customerName}</span>
                          {item.customerPhone && <span className="text-[10px] text-slate-400">{item.customerPhone}</span>}
                        </td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.subtotal)}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(item.discountAmount)}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(item.taxAmount)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(item.totalAmount)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(item.paidAmount)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-rose-600">{formatCurrency(item.balanceAmount)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {item.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">No sales transactions found for selected period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 2. PURCHASES TABLE */}
            {activeTab === 'purchases' && purchaseData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Purchase #</th>
                    <th className="py-3 px-4">Supplier Invoice</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseData.items.content.length > 0 ? (
                    purchaseData.items.content.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.purchaseNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{item.supplierInvoiceNumber || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{item.purchaseDate}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.supplierName}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.subtotal)}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{formatCurrency(item.discountAmount)}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(item.taxAmount)}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(item.totalAmount)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(item.paidAmount)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-rose-600">{formatCurrency(item.balanceAmount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">No inward purchase invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 3. EXPENSES TABLE */}
            {activeTab === 'expenses' && expenseData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Voucher #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseData.items.content.length > 0 ? (
                    expenseData.items.content.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.voucherNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{item.expenseDate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px]">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800">{item.recipientName || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.referenceNumber || '-'}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-700">{formatCurrency(item.amount)}</td>
                        <td className="py-3 px-4 text-slate-600">{item.paymentMode}</td>
                        <td className="py-3 px-4 text-slate-500">@{item.createdBy}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No shop operational expenses recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 4. BASIC PROFIT TABLE */}
            {activeTab === 'profit' && profitData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Sales Revenue</th>
                    <th className="py-3 px-4 text-right">COGS (Batch Cost)</th>
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                    <th className="py-3 px-4 text-right">Gross Margin %</th>
                    <th className="py-3 px-4 text-right">Expenses</th>
                    <th className="py-3 px-4 text-right">Basic Net Profit</th>
                    <th className="py-3 px-4 text-right">Net Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profitData.dailyBreakdowns.length > 0 ? (
                    profitData.dailyBreakdowns.map((item) => (
                      <tr key={item.date} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{item.formattedDate}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatCurrency(item.salesRevenue)}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{formatCurrency(item.costOfGoodsSold)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(item.grossProfit)}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{item.grossMarginPercentage}%</td>
                        <td className="py-3 px-4 text-right text-purple-600">{formatCurrency(item.operatingExpenses)}</td>
                        <td className={`py-3 px-4 text-right font-black ${item.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatCurrency(item.netProfit)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">{item.netMarginPercentage}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No profit records in range</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 5. STOCK SUMMARY TABLE */}
            {activeTab === 'stock_summary' && stockSummaryData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Medicines</th>
                    <th className="py-3 px-4 text-right">Batches</th>
                    <th className="py-3 px-4 text-right">Total Units</th>
                    <th className="py-3 px-4 text-right">Purchase Value</th>
                    <th className="py-3 px-4 text-right">MRP Value</th>
                    <th className="py-3 px-4 text-right">Potential Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockSummaryData.categoryDistribution.map((c) => (
                    <tr key={c.categoryId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.categoryName}</td>
                      <td className="py-3 px-4 text-right">{c.medicineCount}</td>
                      <td className="py-3 px-4 text-right">{c.batchCount}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{c.stockUnits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(c.purchaseValue)}</td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-600">{formatCurrency(c.mrpValue)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(c.mrpValue - c.purchaseValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 6. DETAILED STOCK TABLE */}
            {activeTab === 'stock_detailed' && detailedStockData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Purchase Price</th>
                    <th className="py-3 px-4 text-right">MRP</th>
                    <th className="py-3 px-4 text-right">Purchase Val</th>
                    <th className="py-3 px-4 text-right">MRP Val</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4">Expiry Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedStockData.content.length > 0 ? (
                    detailedStockData.content.map((item) => (
                      <tr key={`${item.medicineId}-${item.batchId}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                          {item.genericName && <span className="text-[10px] text-slate-500">{item.genericName}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.categoryName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.batchNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{item.expiryDate}</td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-indigo-600">{formatCurrency(item.mrp)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.purchaseValue)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">{formatCurrency(item.mrpValue)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800'
                              : item.stockStatus === 'LOW_STOCK'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.stockStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.expiryStatus === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : item.expiryStatus === 'EXPIRING_SOON'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.expiryStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">No inventory batches match criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 7. LOW STOCK TABLE */}
            {activeTab === 'low_stock' && lowStockData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4 text-right">Min Stock</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Deficit</th>
                    <th className="py-3 px-4 text-right">Suggested Reorder</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockData.content.length > 0 ? (
                    lowStockData.content.map((item) => (
                      <tr key={item.medicineId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                          {item.genericName && <span className="text-[10px] text-slate-500">{item.genericName}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.categoryName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.manufacturerName}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">{item.minimumStock}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-700">{item.currentStock} {item.unit}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">-{item.deficit}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">+{item.suggestedReorderQuantity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stockStatus === 'OUT_OF_STOCK' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.stockStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-emerald-600 font-semibold">
                        All dispensary medicines maintain stock above threshold
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 8. EXPIRY TABLE */}
            {activeTab === 'expiry' && expiryData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4 text-right">Days Left</th>
                    <th className="py-3 px-4 text-right">Remaining Qty</th>
                    <th className="py-3 px-4 text-right">Purchase Price</th>
                    <th className="py-3 px-4 text-right">At-Risk Capital</th>
                    <th className="py-3 px-4">Expiry Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiryData.content.length > 0 ? (
                    expiryData.content.map((item) => (
                      <tr key={item.batchId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.medicineName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.categoryName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.batchNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{item.expiryDate}</td>
                        <td className={`py-3 px-4 text-right font-bold ${item.daysUntilExpiry < 0 ? 'text-rose-700' : 'text-amber-700'}`}>
                          {item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)}d ago` : `${item.daysUntilExpiry}d`}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-700">{formatCurrency(item.totalAtRiskPurchaseValue)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.expiryStatus === 'EXPIRED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.expiryStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">No batches match the expiry criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 9. CUSTOMER OUTSTANDING TABLE */}
            {activeTab === 'customer_outstanding' && customerData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4 text-right">Bills Dispensed</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerData.content.length > 0 ? (
                    customerData.content.map((item) => (
                      <tr key={item.customerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.customerName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{item.doctorName || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{item.totalBillsCount}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.totalInvoiced)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(item.totalPaid)}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-700">{formatCurrency(item.outstandingBalance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No customer outstanding records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 10. SUPPLIER OUTSTANDING TABLE */}
            {activeTab === 'supplier_outstanding' && supplierData && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">GSTIN</th>
                    <th className="py-3 px-4 text-right">Purchases Count</th>
                    <th className="py-3 px-4 text-right">Total Invoiced</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierData.content.length > 0 ? (
                    supplierData.content.map((item) => (
                      <tr key={item.supplierId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.supplierName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.phone || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{item.contactPerson || '-'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{item.gstNumber || '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{item.totalPurchasesCount}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.totalInvoiced)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(item.totalPaid)}</td>
                        <td className="py-3 px-4 text-right font-black text-amber-700">{formatCurrency(item.outstandingBalance)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">No supplier outstanding records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Toolbar */}
        {activeTab !== 'stock_summary' && activeTab !== 'profit' && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page + 1}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
