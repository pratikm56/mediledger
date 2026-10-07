import React, { useState, useEffect, useCallback } from 'react';
import { auditService } from '../services/auditService';
import type { AuditLog, AuditLogResponse } from '../types/audit';
import {
  ShieldCheck,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  User,
  Filter
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(20);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        query: searchQuery || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: pageSize
      };
      const res = await auditService.getLogs(params);
      setData(res);
    } catch (err: unknown) {
      console.error('Failed to load audit logs', err);
      setError('Unable to retrieve audit logs from backend database.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, actionFilter, entityFilter, startDate, endDate, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDownloadCsv = async () => {
    try {
      setDownloading(true);
      const params = {
        query: searchQuery || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      await auditService.downloadCsv(params);
    } catch (err: unknown) {
      console.error('Audit export failed', err);
      alert('Failed to export audit logs.');
    } finally {
      setDownloading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CREATE_SALE':
      case 'CREATE_PURCHASE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CREATE_MEDICINE':
      case 'UPDATE_MEDICINE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'STOCK_ADJUSTMENT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CUSTOMER_PAYMENT':
      case 'SUPPLIER_PAYMENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXPENSE_CREATED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SETTINGS_UPDATED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Regulatory Compliance Trail</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">System Audit &amp; Governance Logs</h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Comprehensive tamper-evident record of staff logins, dispensary bills, inventory updates, and financial operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              disabled={downloading || loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
              <span>{downloading ? 'Exporting...' : 'Export Audit CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="LOGOUT">User Logouts</option>
            <option value="CREATE_SALE">Sales Billing</option>
            <option value="CREATE_PURCHASE">Purchases Inward</option>
            <option value="CREATE_MEDICINE">New Medicine</option>
            <option value="UPDATE_MEDICINE">Update Medicine</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
            <option value="CUSTOMER_PAYMENT">Customer Payments</option>
            <option value="SUPPLIER_PAYMENT">Supplier Clearances</option>
            <option value="EXPENSE_CREATED">Store Expenses</option>
            <option value="USER_CREATED">Staff Provisioning</option>
            <option value="SETTINGS_UPDATED">Settings Changes</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Entities</option>
            <option value="USER">User Account</option>
            <option value="SALE">Sale Invoice</option>
            <option value="PURCHASE">Purchase Consignment</option>
            <option value="MEDICINE">Medicine Catalog</option>
            <option value="STOCK_TRANSACTION">Stock Ledger</option>
            <option value="PAYMENT">Payment Voucher</option>
            <option value="EXPENSE">Expense Voucher</option>
            <option value="BUSINESS_SETTINGS">Business Profile</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center space-x-1 text-xs text-slate-600">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="px-2 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, user, or details..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Querying audit logs from PostgreSQL...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.content && data.content.length > 0 ? (
                  data.content.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <span className="font-semibold text-slate-800 block">@{log.username}</span>
                            <span className="text-[10px] text-slate-400">{log.userFullName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.entityType ? (
                          <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md break-words">
                        {log.details || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No audit logs found matching criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {data?.content?.length || 0} of {data?.totalElements || 0} audit records (Page {page + 1} of {data?.totalPages || 1})
          </span>
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
              disabled={(data && page + 1 >= data.totalPages) || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
