import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { medicineService } from '../services/medicineService';
import type { Supplier } from '../types/partner';
import type { Medicine } from '../types/medicine';
import type { 
  Purchase, 
  PurchaseSummary, 
  PaymentStatus, 
  PaymentMode, 
  CreatePurchaseRequest, 
  CreatePurchaseItemRequest 
} from '../types/purchase';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  FileText, 
  CreditCard,
  Building2,
  Calendar,
  Trash2,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PurchaseItemRow extends CreatePurchaseItemRequest {
  tempId: string;
}

export const PurchasesPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Dropdown options
  const [activeSuppliers, setActiveSuppliers] = useState<Supplier[]>([]);
  const [activeMedicines, setActiveMedicines] = useState<Medicine[]>([]);

  // Modals & feedback
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Form State
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState<string>('');
  const [formPurchaseDate, setFormPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('CREDIT');
  const [formPaidAmount, setFormPaidAmount] = useState<number>(0);
  const [formDiscountAmount, setFormDiscountAmount] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');

  const createInitialRow = (): PurchaseItemRow => ({
    tempId: Math.random().toString(36).substring(2, 9),
    medicineId: 0,
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    quantity: 1,
    freeQuantity: 0,
    purchasePrice: 0,
    mrp: 0,
    sellingPrice: 0,
    gstPercentage: 12,
  });

  const [itemRows, setItemRows] = useState<PurchaseItemRow[]>([createInitialRow()]);

  const fetchSummary = async () => {
    try {
      const data = await purchaseService.getPurchaseSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load purchase summary', err);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const suppId = selectedSupplierId ? Number(selectedSupplierId) : undefined;
      const statusParam = statusFilter === 'ALL' ? undefined : (statusFilter as PaymentStatus);
      const data = await purchaseService.searchPurchases(
        searchQuery,
        suppId,
        statusParam,
        startDate || undefined,
        endDate || undefined,
        0,
        50
      );
      setPurchases(data.content);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [suppliers, medicines] = await Promise.all([
        supplierService.getActiveSuppliers(),
        medicineService.getAllActiveMedicines(),
      ]);
      setActiveSuppliers(suppliers);
      setActiveMedicines(medicines);
    } catch (err: any) {
      console.error('Failed to load dropdown references', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    loadDropdownData();
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [searchQuery, selectedSupplierId, statusFilter, startDate, endDate]);

  const handleOpenAddModal = () => {
    setFormSupplierId(activeSuppliers.length > 0 ? String(activeSuppliers[0].id) : '');
    setFormInvoiceNumber('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('CREDIT');
    setFormPaidAmount(0);
    setFormDiscountAmount(0);
    setFormNotes('');
    setItemRows([createInitialRow()]);
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleAddRow = () => {
    setItemRows((prev) => [...prev, createInitialRow()]);
  };

  const handleRemoveRow = (index: number) => {
    if (itemRows.length <= 1) return;
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreatePurchaseItemRequest, value: any) => {
    setItemRows((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // If medicine changed, auto-suggest default GST or existing price if available
      if (field === 'medicineId') {
        const med = activeMedicines.find((m) => m.id === Number(value));
        if (med) {
          item.gstPercentage = med.gstPercentage || 12;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  // Calculations for live form
  const computedSubtotal = itemRows.reduce((acc, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.purchasePrice) || 0;
    return acc + qty * price;
  }, 0);

  const computedTax = itemRows.reduce((acc, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.purchasePrice) || 0;
    const gst = Number(row.gstPercentage) || 0;
    const itemSub = qty * price;
    return acc + (itemSub * gst) / 100;
  }, 0);

  const computedGrandTotal = Math.max(0, computedSubtotal + computedTax - (Number(formDiscountAmount) || 0));
  const computedBalanceDue = Math.max(0, computedGrandTotal - (Number(formPaidAmount) || 0));

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (!formSupplierId) {
        throw new Error('Please select a supplier');
      }

      if (itemRows.length === 0) {
        throw new Error('Please add at least one line item');
      }

      for (let i = 0; i < itemRows.length; i++) {
        const row = itemRows[i];
        if (!row.medicineId) {
          throw new Error(`Row ${i + 1}: Please select a medicine`);
        }
        if (!row.batchNumber.trim()) {
          throw new Error(`Row ${i + 1}: Batch number is required`);
        }
        if (!row.expiryDate) {
          throw new Error(`Row ${i + 1}: Expiry date is required`);
        }
        if (new Date(row.expiryDate) <= new Date()) {
          throw new Error(`Row ${i + 1}: Expiry date must be in the future`);
        }
        if (Number(row.quantity) <= 0) {
          throw new Error(`Row ${i + 1}: Quantity must be at least 1`);
        }
        if (Number(row.purchasePrice) <= 0) {
          throw new Error(`Row ${i + 1}: Purchase price must be greater than 0`);
        }
        if (Number(row.mrp) <= 0) {
          throw new Error(`Row ${i + 1}: MRP must be greater than 0`);
        }
        if (Number(row.sellingPrice) <= 0) {
          throw new Error(`Row ${i + 1}: Selling price must be greater than 0`);
        }
        if (Number(row.sellingPrice) > Number(row.mrp)) {
          throw new Error(`Row ${i + 1}: Selling price cannot exceed MRP`);
        }
      }

      const payload: CreatePurchaseRequest = {
        supplierId: Number(formSupplierId),
        supplierInvoiceNumber: formInvoiceNumber.trim() || undefined,
        purchaseDate: formPurchaseDate,
        paymentMode: formPaymentMode,
        paidAmount: Number(formPaidAmount) || 0,
        discountAmount: Number(formDiscountAmount) || 0,
        notes: formNotes.trim() || undefined,
        items: itemRows.map((r) => ({
          medicineId: Number(r.medicineId),
          batchNumber: r.batchNumber.trim().toUpperCase(),
          expiryDate: r.expiryDate,
          manufacturingDate: r.manufacturingDate || undefined,
          quantity: Number(r.quantity),
          freeQuantity: Number(r.freeQuantity) || 0,
          purchasePrice: Number(r.purchasePrice),
          mrp: Number(r.mrp),
          sellingPrice: Number(r.sellingPrice),
          gstPercentage: Number(r.gstPercentage),
        })),
      };

      const created = await purchaseService.createPurchase(payload);
      setSuccessMessage(`Purchase invoice "${created.purchaseNumber}" recorded successfully! Stock and payables updated.`);
      setShowAddModal(false);
      fetchPurchases();
      fetchSummary();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to record purchase bill');
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
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            <span>Inward Purchase Management</span>
          </h1>
          <p className="text-xs text-slate-500">
            Record supplier bills, batch intake with bonus free quantities, GST input credits, and vendor payables
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchPurchases();
              fetchSummary();
            }}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase Invoice</span>
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Inward Invoices</span>
            <span className="text-lg font-bold text-slate-900">{summary?.totalPurchasesCount || 0} bills</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Purchases Intake</span>
            <span className="text-lg font-bold text-slate-900">
              ₹{(summary?.totalPurchasesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Amount Paid Out</span>
            <span className="text-lg font-bold text-indigo-600">
              ₹{(summary?.totalPaidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Pending Payables Due</span>
            <span className="text-lg font-bold text-rose-600">
              ₹{(summary?.totalDueAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by purchase #, invoice #, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Supplier filter */}
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {activeSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Payment status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid Only</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
          </select>

          {/* Date range */}
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

          {(searchQuery || selectedSupplierId || statusFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSupplierId('');
                setStatusFilter('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Purchase # &amp; Date</th>
                <th className="py-3 px-4">Supplier &amp; Inv #</th>
                <th className="py-3 px-4 text-center">Lines</th>
                <th className="py-3 px-4">Taxable Subtotal</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid / Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading inward purchase records...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase records found matching the search criteria.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const balanceDue = Math.max(0, p.totalAmount - p.paidAmount);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{p.purchaseNumber}</span>
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          <span>{p.purchaseDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800">{p.supplierName}</span>
                        </div>
                        {p.supplierInvoiceNumber && (
                          <span className="font-mono text-[10px] text-slate-500 block">
                            Inv: {p.supplierInvoiceNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                          {p.items?.length || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono">
                        <span>₹{p.subtotal.toFixed(2)}</span>
                        {p.taxAmount > 0 && (
                          <span className="block text-[10px] text-slate-400">+₹{p.taxAmount.toFixed(2)} GST</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{p.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="text-emerald-700 block">Paid: ₹{p.paidAmount.toFixed(2)}</span>
                        {balanceDue > 0 ? (
                          <span className="text-rose-600 font-bold text-[11px]">Due: ₹{balanceDue.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Settled</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {p.paymentStatus === 'PAID' && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                        )}
                        {p.paymentStatus === 'PARTIAL' && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>PARTIAL</span>
                          </span>
                        )}
                        {p.paymentStatus === 'UNPAID' && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>UNPAID</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingPurchase(p)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inward Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Inward Purchase Bill</h3>
                  <p className="text-[11px] text-slate-400">Intake medicine batches into inventory and update supplier payable ledger</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleSavePurchase} className="space-y-4">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Distributor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {activeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Bill / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-881"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as PaymentMode)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="CREDIT">Credit (Payable)</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Items Line Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Medicine Line Items ({itemRows.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 sticky top-0 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2 px-2.5">Medicine</th>
                        <th className="py-2 px-2">Batch #</th>
                        <th className="py-2 px-2">Expiry</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Free</th>
                        <th className="py-2 px-2 text-right">Cost (₹)</th>
                        <th className="py-2 px-2 text-right">MRP (₹)</th>
                        <th className="py-2 px-2 text-right">Sale (₹)</th>
                        <th className="py-2 px-2 text-right">GST %</th>
                        <th className="py-2 px-2 text-right">Total (₹)</th>
                        <th className="py-2 px-1 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemRows.map((row, idx) => {
                        const lineSub = (Number(row.quantity) || 0) * (Number(row.purchasePrice) || 0);
                        const lineTax = (lineSub * (Number(row.gstPercentage) || 0)) / 100;
                        const lineTotal = lineSub + lineTax;

                        return (
                          <tr key={row.tempId} className="hover:bg-slate-50/50">
                            {/* Medicine select */}
                            <td className="py-1.5 px-2.5 min-w-[160px]">
                              <select
                                required
                                value={row.medicineId}
                                onChange={(e) => handleItemChange(idx, 'medicineId', Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                              >
                                <option value={0}>-- Select Medicine --</option>
                                {activeMedicines.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.packSize || m.unit})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Batch # */}
                            <td className="py-1.5 px-2 min-w-[90px]">
                              <input
                                type="text"
                                required
                                placeholder="BATCH123"
                                value={row.batchNumber}
                                onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono uppercase"
                              />
                            </td>

                            {/* Expiry Date */}
                            <td className="py-1.5 px-2 min-w-[110px]">
                              <input
                                type="date"
                                required
                                value={row.expiryDate}
                                onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                              />
                            </td>

                            {/* Qty */}
                            <td className="py-1.5 px-2 w-16">
                              <input
                                type="number"
                                min={1}
                                required
                                value={row.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              />
                            </td>

                            {/* Free Qty */}
                            <td className="py-1.5 px-2 w-16">
                              <input
                                type="number"
                                min={0}
                                value={row.freeQuantity}
                                onChange={(e) => handleItemChange(idx, 'freeQuantity', Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              />
                            </td>

                            {/* Purchase Price */}
                            <td className="py-1.5 px-2 w-20">
                              <input
                                type="number"
                                min={0.01}
                                step="any"
                                required
                                value={row.purchasePrice || ''}
                                onChange={(e) => handleItemChange(idx, 'purchasePrice', Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              />
                            </td>

                            {/* MRP */}
                            <td className="py-1.5 px-2 w-20">
                              <input
                                type="number"
                                min={0.01}
                                step="any"
                                required
                                value={row.mrp || ''}
                                onChange={(e) => handleItemChange(idx, 'mrp', Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              />
                            </td>

                            {/* Selling Price */}
                            <td className="py-1.5 px-2 w-20">
                              <input
                                type="number"
                                min={0.01}
                                step="any"
                                required
                                value={row.sellingPrice || ''}
                                onChange={(e) => handleItemChange(idx, 'sellingPrice', Number(e.target.value))}
                                className="w-full px-1.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              />
                            </td>

                            {/* GST % */}
                            <td className="py-1.5 px-2 w-16">
                              <select
                                value={row.gstPercentage}
                                onChange={(e) => handleItemChange(idx, 'gstPercentage', Number(e.target.value))}
                                className="w-full px-1 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                              >
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                              </select>
                            </td>

                            {/* Row Total */}
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800">
                              ₹{lineTotal.toFixed(2)}
                            </td>

                            {/* Remove button */}
                            <td className="py-1.5 px-1 text-center">
                              {itemRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                  title="Remove line"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary and Payment Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Delivered by Courier #4901; batch discount applied"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-semibold">₹{computedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax Input:</span>
                    <span className="font-mono font-semibold">₹{computedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={formDiscountAmount}
                      onChange={(e) => setFormDiscountAmount(Number(e.target.value))}
                      className="w-24 px-2 py-0.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700">₹{computedGrandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                    <span>Amount Paid Now (₹):</span>
                    <input
                      type="number"
                      min={0}
                      max={computedGrandTotal}
                      step="any"
                      value={formPaidAmount}
                      onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                      className="w-24 px-2 py-0.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-mono font-bold text-blue-700"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-xs">
                    <span className="text-slate-700">Supplier Balance Due:</span>
                    <span className={`font-mono ${computedBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{computedBalanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                    <span>Record Inward Bill &amp; Update Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Details Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Purchase Invoice Breakdown
                </span>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {viewingPurchase.purchaseNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Supplier Distributor</span>
                <span className="font-bold text-slate-900">{viewingPurchase.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Supplier Invoice #</span>
                <span className="font-mono font-semibold text-slate-800">
                  {viewingPurchase.supplierInvoiceNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Purchase Date</span>
                <span className="font-medium text-slate-800">{viewingPurchase.purchaseDate}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Payment Status</span>
                <span className="font-bold text-slate-900">{viewingPurchase.paymentStatus}</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Medicine</th>
                    <th className="py-2 px-2">Batch #</th>
                    <th className="py-2 px-2">Expiry</th>
                    <th className="py-2 px-2 text-right">Inward Qty</th>
                    <th className="py-2 px-2 text-right">Cost (₹)</th>
                    <th className="py-2 px-2 text-right">MRP (₹)</th>
                    <th className="py-2 px-2 text-right">GST</th>
                    <th className="py-2 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingPurchase.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-slate-900">{item.medicineName || 'Medicine'}</td>
                      <td className="py-2 px-2 font-mono font-bold text-slate-700">{item.batchNumber}</td>
                      <td className="py-2 px-2 font-mono text-slate-600">{item.expiryDate}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        {item.quantity}
                        {item.freeQuantity > 0 && (
                          <span className="text-emerald-600 text-[10px] block">+{item.freeQuantity} free</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">₹{item.purchasePrice.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-mono text-slate-500">{item.gstPercentage}%</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Recorded By:</span>
                <span className="font-semibold text-slate-700">{viewingPurchase.createdBy}</span>
                {viewingPurchase.notes && (
                  <p className="text-slate-500 text-[11px] mt-1 italic">"{viewingPurchase.notes}"</p>
                )}
              </div>

              <div className="space-y-1 w-full sm:w-64">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{viewingPurchase.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-mono">₹{viewingPurchase.taxAmount.toFixed(2)}</span>
                </div>
                {viewingPurchase.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{viewingPurchase.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700">₹{viewingPurchase.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Paid:</span>
                  <span className="font-mono text-blue-600">₹{viewingPurchase.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                  <span className="text-slate-800">Payable Due:</span>
                  <span className="font-mono text-rose-600">
                    ₹{Math.max(0, viewingPurchase.totalAmount - viewingPurchase.paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
