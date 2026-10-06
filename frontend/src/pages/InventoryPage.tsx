import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService } from '../services/inventoryService';
import { batchService } from '../services/batchService';
import { medicineService } from '../services/medicineService';
import { categoryService } from '../services/categoryService';
import type { 
  InventorySummary, 
  MedicineStock, 
  MedicineBatch, 
  StockTransaction, 
  CreateMedicineBatchRequest, 
  StockAdjustmentRequest,
  StockTransactionType
} from '../types/inventory';
import type { Medicine, Category } from '../types/medicine';
import { 
  Package, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Clock, 
  FileText, 
  Tag
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;
  const [, startTransition] = useTransition();

  // Active Tab: 'stock' | 'expiry' | 'history'
  const [activeTab, setActiveTab] = useState<'stock' | 'expiry' | 'history'>('stock');

  // KPI Summary
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);

  // Tab 1: Current Stock State
  const [medicineStocks, setMedicineStocks] = useState<MedicineStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [expandedMedicineId, setExpandedMedicineId] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState<boolean>(false);

  // Tab 2: Expiry Tracker State
  const [expiryWindowDays, setExpiryWindowDays] = useState<number>(30);
  const [expiringBatches, setExpiringBatches] = useState<MedicineBatch[]>([]);
  const [expiredBatches, setExpiredBatches] = useState<MedicineBatch[]>([]);
  const [expiryTabMode, setExpiryTabMode] = useState<'expiring' | 'expired'>('expiring');
  const [expiryLoading, setExpiryLoading] = useState<boolean>(false);

  // Tab 3: Transactions History State
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Shared Data for Modals
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);

  // Modals
  const [showAddBatchModal, setShowAddBatchModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<MedicineBatch | null>(null);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Add Batch Form Data
  const [batchFormData, setBatchFormData] = useState<CreateMedicineBatchRequest>({
    medicineId: 0,
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    purchasePrice: 0,
    mrp: 0,
    sellingPrice: 0,
    gstPercentage: 12.00,
    initialQuantity: 10,
  });

  // Adjust Stock Form Data
  const [adjustFormData, setAdjustFormData] = useState<StockAdjustmentRequest>({
    batchId: 0,
    transactionType: 'ADJUSTMENT',
    quantityChange: 0,
    reason: '',
  });

  // 1. Fetch KPI Summary
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await inventoryService.getSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load inventory summary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. Fetch Current Stock
  const fetchCurrentStock = async () => {
    setStockLoading(true);
    try {
      const data = await inventoryService.getStockOverview({
        query: searchQuery,
        categoryId: selectedCategory ? Number(selectedCategory) : undefined,
        lowStockOnly: lowStockOnly || undefined,
        page: 0,
        size: 50,
      });
      setMedicineStocks(data.content);
    } catch (err: any) {
      console.error('Failed to load stock overview', err);
    } finally {
      setStockLoading(false);
    }
  };

  // 3. Fetch Expiry Data
  const fetchExpiryData = async () => {
    setExpiryLoading(true);
    try {
      const [expiringRes, expiredRes] = await Promise.all([
        inventoryService.getExpiringBatches(expiryWindowDays, 0, 50),
        inventoryService.getExpiredBatches(0, 50),
      ]);
      setExpiringBatches(expiringRes.content);
      setExpiredBatches(expiredRes.content);
    } catch (err: any) {
      console.error('Failed to load expiry batches', err);
    } finally {
      setExpiryLoading(false);
    }
  };

  // 4. Fetch Transactions History
  const fetchTransactions = async () => {
    setHistoryLoading(true);
    try {
      const data = await inventoryService.getStockTransactions({ page: 0, size: 50 });
      setTransactions(data.content);
    } catch (err: any) {
      console.error('Failed to load stock transactions', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load Initial Metadata
  useEffect(() => {
    fetchSummary();
    categoryService.getCategories(true).then(setCategories).catch(console.error);
    medicineService.getAllActiveMedicines().then((meds) => {
      setAllMedicines(meds);
      if (meds.length > 0 && batchFormData.medicineId === 0) {
        setBatchFormData((prev) => ({ ...prev, medicineId: meds[0].id }));
      }
    }).catch(console.error);
  }, []);

  // Reload tab-specific data on tab change
  useEffect(() => {
    if (activeTab === 'stock') {
      fetchCurrentStock();
    } else if (activeTab === 'expiry') {
      fetchExpiryData();
    } else if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, searchQuery, selectedCategory, lowStockOnly, expiryWindowDays]);

  // Handle Add Batch Submission
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    if (batchFormData.sellingPrice > batchFormData.mrp) {
      setErrorMessage('Selling price cannot exceed MRP');
      setFormSubmitting(false);
      return;
    }

    try {
      const created = await batchService.createBatch(batchFormData);
      setSuccessMessage(`Batch "${created.batchNumber}" created with ${created.quantity} units!`);
      setShowAddBatchModal(false);
      fetchSummary();
      fetchCurrentStock();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to create batch');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Adjust Modal for a specific batch
  const handleOpenAdjustModal = (batch: MedicineBatch) => {
    setSelectedBatchForAdjust(batch);
    setAdjustFormData({
      batchId: batch.id,
      transactionType: 'ADJUSTMENT',
      quantityChange: 0,
      reason: '',
    });
    setErrorMessage(null);
    setShowAdjustModal(true);
  };

  // Handle Stock Adjustment Submission
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    if (adjustFormData.quantityChange === 0) {
      setErrorMessage('Quantity change must not be 0');
      setFormSubmitting(false);
      return;
    }

    if (!adjustFormData.reason || adjustFormData.reason.trim().length < 3) {
      setErrorMessage('A valid reason (minimum 3 characters) is required for every stock adjustment');
      setFormSubmitting(false);
      return;
    }

    try {
      const tx = await inventoryService.adjustStock(adjustFormData);
      setSuccessMessage(`Stock adjusted! Batch ${tx.batchNumber} now has ${tx.quantityAfter} units.`);
      setShowAdjustModal(false);
      fetchSummary();
      if (activeTab === 'stock') fetchCurrentStock();
      if (activeTab === 'expiry') fetchExpiryData();
      if (activeTab === 'history') fetchTransactions();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Inventory &amp; Batch Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock valuation, batch-level tracking, FEFO dispatch, and audit logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              fetchSummary();
              if (activeTab === 'stock') fetchCurrentStock();
              if (activeTab === 'expiry') fetchExpiryData();
              if (activeTab === 'history') fetchTransactions();
            }}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canManage && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setShowAddBatchModal(true);
              }}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Batch</span>
            </button>
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Stock Units */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            {loadingSummary ? '...' : summary?.totalInventoryUnits || 0}
          </span>
          <span className="text-[10px] text-slate-500">units in pharmacy</span>
        </div>

        {/* Purchase Valuation */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purchase Value</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{loadingSummary ? '...' : (summary?.totalPurchaseValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Cost basis</span>
        </div>

        {/* Retail Selling Value */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retail Valuation</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{loadingSummary ? '...' : (summary?.totalSellingValuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Potential revenue</span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Alert</span>
          <span className={`text-lg font-black mt-1 block ${summary?.lowStockCount ? 'text-amber-600' : 'text-slate-900'}`}>
            {loadingSummary ? '...' : summary?.lowStockCount || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Under min threshold</span>
        </div>

        {/* Expiring in 30 Days */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiring &lt;30d</span>
          <span className={`text-lg font-black mt-1 block ${summary?.expiringWithin30DaysCount ? 'text-rose-600' : 'text-slate-900'}`}>
            {loadingSummary ? '...' : summary?.expiringWithin30DaysCount || 0}
          </span>
          <span className="text-[10px] text-rose-500 font-medium">Near expiry batches</span>
        </div>

        {/* Expired Batches */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expired Stock</span>
          <span className={`text-lg font-black mt-1 block ${summary?.expiredBatchesCount ? 'text-red-700' : 'text-slate-900'}`}>
            {loadingSummary ? '...' : summary?.expiredBatchesCount || 0}
          </span>
          <span className="text-[10px] text-red-600 font-medium">Immediate disposal</span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-1 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'stock'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Current Stock &amp; Batches</span>
        </button>

        <button
          onClick={() => setActiveTab('expiry')}
          className={`pb-3 px-1 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'expiry'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Expiry Tracker</span>
          {(summary?.expiringWithin30DaysCount || 0) + (summary?.expiredBatchesCount || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              {(summary?.expiringWithin30DaysCount || 0) + (summary?.expiredBatchesCount || 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Stock Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK & BATCH ACCORDION */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by brand or generic compound..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  startTransition(() => {
                    setSelectedCategory(e.target.value);
                  });
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-semibold text-amber-700">Low Stock Only</span>
              </label>
            </div>
          </div>

          {/* Medicines Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Medicine &amp; Category</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4">Min Threshold</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Active Batches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading stock details...</span>
                        </div>
                      </td>
                    </tr>
                  ) : medicineStocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No inventory records match the current filters.
                      </td>
                    </tr>
                  ) : (
                    medicineStocks.map((med) => {
                      const isExpanded = expandedMedicineId === med.medicineId;
                      return (
                        <React.Fragment key={med.medicineId}>
                          <tr 
                            onClick={() => setExpandedMedicineId(isExpanded ? null : med.medicineId)}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{med.medicineName}</span>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                                <span>{med.categoryName}</span>
                                <span>&bull;</span>
                                <span>{med.unit} ({med.packSize})</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {med.manufacturerName || '—'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="font-semibold">{med.minimumStock}</span> units
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm font-black ${
                                med.currentStock === 0 ? 'text-rose-600' :
                                med.lowStock ? 'text-amber-600' : 'text-slate-900'
                              }`}>
                                {med.currentStock}
                              </span>
                              <span className="text-[10px] text-slate-400 block">{med.unit}s</span>
                            </td>
                            <td className="py-3 px-4">
                              {med.currentStock === 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                  OUT OF STOCK
                                </span>
                              ) : med.lowStock ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                  LOW STOCK
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                  IN STOCK
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold text-xs">
                                {med.batchCount} {med.batchCount === 1 ? 'batch' : 'batches'}
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Batches Breakdown */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={7} className="p-4">
                                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Available Batches for {med.medicineName} (FEFO Ordered)</span>
                                    </h4>
                                    <span className="text-[11px] text-slate-400">
                                      Earliest expiry batch is prioritized automatically at checkout
                                    </span>
                                  </div>

                                  {med.batches.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-3 text-center">
                                      No batches registered yet for this medicine.
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase">
                                          <tr>
                                            <th className="py-2 px-3">Batch No</th>
                                            <th className="py-2 px-3">Expiry Date</th>
                                            <th className="py-2 px-3">Days Left</th>
                                            <th className="py-2 px-3">Purchase Rate</th>
                                            <th className="py-2 px-3">MRP / Selling</th>
                                            <th className="py-2 px-3">Stock Units</th>
                                            <th className="py-2 px-3 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {med.batches.map((batch, index) => {
                                            const isFefoPick = index === 0 && !batch.expired && batch.quantity > 0;
                                            return (
                                              <tr key={batch.id} className="hover:bg-slate-50">
                                                <td className="py-2 px-3">
                                                  <div className="flex items-center space-x-1.5">
                                                    <span className="font-mono font-bold text-slate-800">
                                                      {batch.batchNumber}
                                                    </span>
                                                    {isFefoPick && (
                                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 uppercase">
                                                        FEFO NEXT
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="py-2 px-3">
                                                  <span className={batch.expired ? 'text-red-600 font-bold' : 'text-slate-700'}>
                                                    {batch.expiryDate}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                  {batch.expired ? (
                                                    <span className="text-red-600 font-bold">Expired</span>
                                                  ) : (
                                                    <span className={batch.daysUntilExpiry <= 30 ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                                                      {batch.daysUntilExpiry} days
                                                    </span>
                                                  )}
                                                </td>
                                                <td className="py-2 px-3 text-slate-600 font-mono">
                                                  ₹{batch.purchasePrice.toFixed(2)}
                                                </td>
                                                <td className="py-2 px-3 font-mono">
                                                  <span className="text-slate-400 line-through text-[10px] mr-1">
                                                    ₹{batch.mrp.toFixed(2)}
                                                  </span>
                                                  <span className="font-bold text-slate-800">
                                                    ₹{batch.sellingPrice.toFixed(2)}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                  <span className="font-black text-slate-900">{batch.quantity}</span>
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                  {canManage && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAdjustModal(batch);
                                                      }}
                                                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                                                    >
                                                      Adjust Qty
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPIRY TRACKER */}
      {activeTab === 'expiry' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpiryTabMode('expiring')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  expiryTabMode === 'expiring'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Expiring Soon ({expiringBatches.length})
              </button>
              <button
                onClick={() => setExpiryTabMode('expired')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  expiryTabMode === 'expired'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Already Expired ({expiredBatches.length})
              </button>
            </div>

            {expiryTabMode === 'expiring' && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-medium">Window:</span>
                <select
                  value={expiryWindowDays}
                  onChange={(e) => setExpiryWindowDays(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value={30}>Within 30 Days</option>
                  <option value={60}>Within 60 Days</option>
                  <option value={90}>Within 90 Days</option>
                  <option value={180}>Within 180 Days</option>
                </select>
              </div>
            )}
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Medicine Name</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Remaining Days</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4">Cost Basis</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiryLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading batches...
                      </td>
                    </tr>
                  ) : (expiryTabMode === 'expiring' ? expiringBatches : expiredBatches).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {expiryTabMode === 'expiring' 
                          ? 'No batches expiring within the selected window.' 
                          : 'No expired batches currently in stock.'}
                      </td>
                    </tr>
                  ) : (
                    (expiryTabMode === 'expiring' ? expiringBatches : expiredBatches).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {b.medicineName}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {b.batchNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-rose-600">
                          {b.expiryDate}
                        </td>
                        <td className="py-3 px-4">
                          {b.expired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {b.daysUntilExpiry} days left
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {b.quantity} units
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          ₹{(b.purchasePrice * b.quantity).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canManage && (
                            <button
                              onClick={() => handleOpenAdjustModal(b)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            >
                              {b.expired ? 'Dispose / Write-Off' : 'Adjust Stock'}
                            </button>
                          )}
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

      {/* TAB 3: STOCK AUDIT LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Immutable Inventory Audit Ledger</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Every stock movement records actor, timestamp, reference &amp; reason
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Qty Delta</th>
                  <th className="py-3 px-4">Qty After</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading audit ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tx.medicineName}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {tx.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800">
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold font-mono">
                        {tx.quantityChange > 0 ? (
                          <span className="text-emerald-600">+{tx.quantityChange}</span>
                        ) : (
                          <span className="text-rose-600">{tx.quantityChange}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-slate-800">
                        {tx.quantityAfter}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {tx.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 text-[11px]">
                        @{tx.createdBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW BATCH */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add New Medicine Batch</h3>
              </div>
              <button
                onClick={() => setShowAddBatchModal(false)}
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

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicine <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={batchFormData.medicineId}
                  onChange={(e) => setBatchFormData({ ...batchFormData, medicineId: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="" disabled>Select Medicine</option>
                  {allMedicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026A"
                    value={batchFormData.batchNumber}
                    onChange={(e) => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={batchFormData.initialQuantity}
                    onChange={(e) => setBatchFormData({ ...batchFormData, initialQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    value={batchFormData.manufacturingDate}
                    onChange={(e) => setBatchFormData({ ...batchFormData, manufacturingDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={batchFormData.expiryDate}
                    onChange={(e) => setBatchFormData({ ...batchFormData, expiryDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={batchFormData.purchasePrice}
                    onChange={(e) => setBatchFormData({ ...batchFormData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={batchFormData.mrp}
                    onChange={(e) => setBatchFormData({ ...batchFormData, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={batchFormData.sellingPrice}
                    onChange={(e) => setBatchFormData({ ...batchFormData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Create Batch</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {showAdjustModal && selectedBatchForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Stock Adjustment: {selectedBatchForAdjust.batchNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
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

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Medicine:</span>
                <span className="font-bold text-slate-800">{selectedBatchForAdjust.medicineName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Available Quantity:</span>
                <span className="font-bold text-emerald-700">{selectedBatchForAdjust.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Date:</span>
                <span className="font-semibold text-slate-700">{selectedBatchForAdjust.expiryDate}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adjustFormData.transactionType}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, transactionType: e.target.value as StockTransactionType })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ADJUSTMENT">Manual Adjustment (Inventory Audit Difference)</option>
                  <option value="DAMAGED">Damaged / Broken Packaging (Write-Off)</option>
                  <option value="EXPIRED">Expired Batch Disposal (Write-Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Delta (Units to Add or Deduct) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -5 to deduct, +10 to add"
                  value={adjustFormData.quantityChange || ''}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, quantityChange: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Use negative values (e.g. -2) to deduct damaged/expired units.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Reason / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe why stock is being adjusted (e.g. Water damage on shelf B-2)..."
                  value={adjustFormData.reason}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Commit Adjustment</span>
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
