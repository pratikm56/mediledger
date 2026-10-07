import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import type { DashboardSummary, DashboardTrendItem, DashboardAlerts } from '../types/dashboard';
import {
  TrendingUp,
  ShoppingBag,
  Truck,
  Receipt,
  Pill,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  Wallet,
  Building2,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, isOwner, isAdmin } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrendItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [trendDays, setTrendDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [summaryData, trendData, alertsData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTrends(trendDays),
        dashboardService.getAlerts()
      ]);

      setSummary(summaryData);
      setTrends(trendData);
      setAlerts(alertsData);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data', err);
      setError('Unable to load real-time pharmacy dashboard metrics. Please check server connectivity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePeriodChange = (days: number) => {
    setTrendDays(days);
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

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium text-sm">Aggregating live pharmacy ledger metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Pharmacy Dashboard &bull; {todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              MediLedger Dispensary Portal
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Welcome back, <strong className="text-emerald-300">{user?.fullName}</strong>. Live sales, batch inventory valuations, operational alerts, and daily profits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-xs disabled:opacity-50"
              title="Refresh all metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Link
              to="/sales"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/40"
            >
              <Plus className="w-4 h-4" />
              <span>New POS Bill</span>
            </Link>

            {(isOwner || isAdmin) && (
              <>
                <Link
                  to="/purchases"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inward Purchase</span>
                </Link>

                <Link
                  to="/expenses"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Expense</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <Pill className="w-80 h-80" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Today's Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Sales</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(summary?.todaySalesAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{summary?.todaySalesCount || 0} Bills Dispensed</span>
              <span className="text-emerald-600 font-semibold">Today</span>
            </div>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Purchases</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(summary?.todayPurchasesAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{summary?.todayPurchasesCount || 0} Consignments In</span>
              <span className="text-blue-600 font-semibold">Stock Inward</span>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Expenses</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(summary?.todayExpensesAmount)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{summary?.todayExpensesCount || 0} Shop Vouchers</span>
              <span className="text-purple-600 font-semibold">Operating Cost</span>
            </div>
          </div>
        </div>

        {/* Today's Basic Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Basic Profit</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono" title="Formula: Sales Revenue - Cost of Goods Sold - Expenses">Formula</span>
            </div>
            <div className={`p-2.5 rounded-xl ${
              (summary?.todayNetProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-3">
            <div className={`text-2xl font-black ${
              (summary?.todayNetProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatCurrency(summary?.todayNetProfit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span>Gross: {formatCurrency(summary?.todayGrossProfit)}</span>
              <span className="mx-1">&bull;</span>
              <span>COGS: {formatCurrency(summary?.todayCostOfGoodsSold)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Stock Valuations & Ledger Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medicines & Batches */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-500">Catalog &amp; Batches</span>
            <Pill className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {summary?.totalMedicines || 0} <span className="text-xs font-normal text-slate-500">Medicines</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{summary?.totalBatches || 0} Active Batches</span>
            <span className="font-semibold text-indigo-600">{summary?.totalStockUnits?.toLocaleString() || 0} Units</span>
          </div>
        </div>

        {/* Total Stock Purchase & MRP Valuation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-500">Stock Valuation</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {formatCurrency(summary?.totalStockPurchaseValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>MRP: {formatCurrency(summary?.totalStockMrpValue)}</span>
            <span className="text-emerald-600 font-semibold">
              +{(summary && summary.totalStockPurchaseValue > 0 
                ? (((summary.totalStockMrpValue - summary.totalStockPurchaseValue) / summary.totalStockPurchaseValue) * 100).toFixed(0) 
                : 0)}% MRP
            </span>
          </div>
        </div>

        {/* Customer Receivables (Outstanding) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-500">Customer Outstanding</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {formatCurrency(summary?.customerOutstanding)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Credit Dues Receivable</span>
            <Link to="/customers" className="text-rose-600 hover:underline font-semibold flex items-center">
              <span>View</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Supplier Payables (Outstanding) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-slate-500">Supplier Outstanding</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">
            {formatCurrency(summary?.supplierOutstanding)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Invoices Payable</span>
            <Link to="/suppliers" className="text-amber-600 hover:underline font-semibold flex items-center">
              <span>View</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Interactive Charts (Recharts) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pharmacy Financial Trends &amp; Daily Profit</h2>
            <p className="text-xs text-slate-500">Real-time daily continuous revenue, batch acquisition costs, and basic net margin</p>
          </div>
          
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => handlePeriodChange(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  trendDays === days
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Revenue vs COGS vs Net Profit */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Sales Revenue vs Cost of Goods vs Profit</span>
            </h3>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0)]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="salesAmount" name="Sales Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                  <Area type="monotone" dataKey="cogsAmount" name="Cost of Goods (COGS)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="netProfit" name="Basic Net Profit" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Purchases vs Shop Expenses */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
              <span>Purchases (Stock Inflow) vs Operating Expenses</span>
            </h3>
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0)]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="purchasesAmount" name="Inward Purchases" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expensesAmount" name="Shop Expenses" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Critical Operational Watchlists & Recent Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Low Stock Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Low Stock Alerts</h3>
                  <p className="text-[11px] text-slate-500">{summary?.lowStockCount || 0} items at or below minimum stock</p>
                </div>
              </div>
              <Link to="/inventory" className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold">
                Manage
              </Link>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {alerts?.lowStockItems && alerts.lowStockItems.length > 0 ? (
                alerts.lowStockItems.map((item) => (
                  <div key={item.medicineId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{item.medicineName}</span>
                      <span className="text-[11px] text-slate-500">{item.categoryName} &bull; Min: {item.minimumStock}</span>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        item.currentStock === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="font-medium text-slate-700">Stock Levels Healthy</p>
                  <p className="text-[11px]">No medicines currently below minimum threshold</p>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/purchases"
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1 hover:text-emerald-700"
          >
            <span>Create Inward Reorder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Expiry Watchlist (≤ 30 Days & Expired) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Expiry Watchlist</h3>
                  <p className="text-[11px] text-slate-500">
                    {summary?.expiredBatchesCount || 0} expired &bull; {summary?.expiringWithin30DaysCount || 0} expiring soon
                  </p>
                </div>
              </div>
              <Link to="/inventory" className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold">
                Audit
              </Link>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {alerts?.expiredItems && alerts.expiredItems.length > 0 && (
                alerts.expiredItems.map((b) => (
                  <div key={b.id} className="py-2 flex items-center justify-between text-xs bg-rose-50/50 px-2 rounded-lg my-1">
                    <div>
                      <span className="font-semibold text-rose-900 block">{b.medicineName}</span>
                      <span className="text-[11px] text-rose-700">Batch {b.batchNumber} &bull; Expired: {b.expiryDate}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
                      {b.quantity} Expired
                    </span>
                  </div>
                ))
              )}

              {alerts?.expiringItems && alerts.expiringItems.length > 0 ? (
                alerts.expiringItems.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{b.medicineName}</span>
                      <span className="text-[11px] text-slate-500">Batch {b.batchNumber} &bull; Exp: {b.expiryDate}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      {b.daysUntilExpiry}d left ({b.quantity})
                    </span>
                  </div>
                ))
              ) : (
                (!alerts?.expiredItems || alerts.expiredItems.length === 0) && (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="font-medium text-slate-700">No Expiry Risk Detected</p>
                    <p className="text-[11px]">All batches valid beyond 30-day window</p>
                  </div>
                )
              )}
            </div>
          </div>

          <Link
            to="/inventory"
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-600 font-semibold flex items-center justify-center space-x-1 hover:text-amber-700"
          >
            <span>Review Full Batch Expiry Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Recent Bills / Dispensing Stream */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Recent Counter Bills</h3>
                  <p className="text-[11px] text-slate-500">Latest dispensed retail sales receipts</p>
                </div>
              </div>
              <Link to="/sales" className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold">
                All Bills
              </Link>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {alerts?.recentSales && alerts.recentSales.length > 0 ? (
                alerts.recentSales.map((sale) => (
                  <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {sale.paymentMode}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{sale.customerName} &bull; {sale.saleDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">{formatCurrency(sale.totalAmount)}</span>
                      <span className={`text-[10px] font-bold ${
                        sale.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <Receipt className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-medium text-slate-700">No Sales Dispensed Today</p>
                  <p className="text-[11px]">Generate a new bill at the POS checkout</p>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/sales"
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1 hover:text-emerald-700"
          >
            <span>Open POS Dispensing Counter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm">Pharmacy Operations Shortcuts</h4>
            <p className="text-[11px] text-slate-400">Quickly jump between master catalog, inventory management, suppliers, and ledger vouchers</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/medicines" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
            Medicines Master
          </Link>
          <Link to="/inventory" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
            Batch Inventory
          </Link>
          <Link to="/customers" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
            Customers
          </Link>
          <Link to="/suppliers" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
            Suppliers
          </Link>
          <Link to="/expenses" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
            Vouchers &amp; Receipts
          </Link>
        </div>
      </div>
    </div>
  );
};
