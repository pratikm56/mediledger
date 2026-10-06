import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saleService } from '../services/saleService';
import { medicineService } from '../services/medicineService';
import { batchService } from '../services/batchService';
import { customerService } from '../services/customerService';
import type { Customer } from '../types/partner';
import type { Medicine } from '../types/medicine';
import type { MedicineBatch } from '../types/inventory';
import type { Sale, SaleSummary, CreateSaleRequest, CreateSaleItemRequest } from '../types/sale';
import type { PaymentMode, PaymentStatus } from '../types/purchase';
import { 
  Receipt, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  CreditCard,
  Calendar,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  Plus,
  Minus,
  Sparkles,
  UserCheck,
  Stethoscope,
  ShoppingBag,
  List
} from 'lucide-react';

interface CartItem extends CreateSaleItemRequest {
  tempId: string;
  medicineName: string;
  packSize?: string;
  batchNumber: string;
  expiryDate: string;
  availableStock: number;
  mrp: number;
  gstPercentage: number;
}

export const BillingPage: React.FC = () => {
  const { user } = useAuth();

  // Active view: 'pos' (Cashier Checkout) or 'history' (Invoices Ledger)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // References
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SaleSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Search / Filters for History
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');

  // POS State
  const [isWalkIn, setIsWalkIn] = useState<boolean>(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Item Selector State
  const [selectedMedicineId, setSelectedMedicineId] = useState<number>(0);
  const [availableBatches, setAvailableBatches] = useState<MedicineBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(0);
  const [inputQty, setInputQty] = useState<number>(1);
  const [inputPrice, setInputPrice] = useState<number>(0);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals & Feedback
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchDropdownData = async () => {
    try {
      const [medList, custList] = await Promise.all([
        medicineService.getAllActiveMedicines(),
        customerService.getActiveCustomers(),
      ]);
      setMedicines(medList);
      setCustomers(custList);
    } catch (err: any) {
      console.error('Failed to load medicine or customer directory', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await saleService.getSaleSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load sales summary', err);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const statusParam = statusFilter === 'ALL' ? undefined : (statusFilter as PaymentStatus);
      const data = await saleService.searchSales(
        searchQuery,
        undefined,
        statusParam,
        historyStartDate || undefined,
        historyEndDate || undefined,
        0,
        50
      );
      setSales(data.content);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchSales();
    }
  }, [activeTab, searchQuery, statusFilter, historyStartDate, historyEndDate]);

  // When medicine changes in POS selector, fetch available batches (FEFO sorted)
  useEffect(() => {
    if (!selectedMedicineId) {
      setAvailableBatches([]);
      setSelectedBatchId(0);
      return;
    }
    const loadBatches = async () => {
      try {
        const batches = await batchService.getAvailableBatchesForSale(selectedMedicineId);
        setAvailableBatches(batches);
        if (batches.length > 0) {
          // Default to first batch (earliest expiry - FEFO!)
          setSelectedBatchId(batches[0].id);
          setInputPrice(batches[0].sellingPrice);
          setInputQty(1);
        } else {
          setSelectedBatchId(0);
          setInputPrice(0);
        }
      } catch (err) {
        console.error('Failed to load batches for medicine', err);
      }
    };
    loadBatches();
  }, [selectedMedicineId]);

  // When selected batch changes, update price
  useEffect(() => {
    if (selectedBatchId && availableBatches.length > 0) {
      const b = availableBatches.find((item) => item.id === selectedBatchId);
      if (b) {
        setInputPrice(b.sellingPrice);
      }
    }
  }, [selectedBatchId, availableBatches]);

  // Handle Registered Customer selection
  const handleCustomerSelect = (idStr: string) => {
    setSelectedCustomerId(idStr);
    if (!idStr) {
      setIsWalkIn(true);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDoctorName('');
      return;
    }
    const c = customers.find((cust) => cust.id === Number(idStr));
    if (c) {
      setIsWalkIn(false);
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
      setDoctorName(c.doctorName || '');
    }
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    setErrorMessage(null);
    if (!selectedMedicineId) {
      setErrorMessage('Please select a medicine');
      return;
    }
    if (!selectedBatchId) {
      setErrorMessage('No available stock batches found for this medicine');
      return;
    }
    const batch = availableBatches.find((b) => b.id === selectedBatchId);
    if (!batch) {
      setErrorMessage('Invalid batch selected');
      return;
    }
    if (inputQty <= 0) {
      setErrorMessage('Quantity must be at least 1');
      return;
    }
    if (inputQty > batch.quantity) {
      setErrorMessage(`Cannot exceed available batch stock (${batch.quantity} units)`);
      return;
    }
    if (inputPrice <= 0) {
      setErrorMessage('Selling price must be greater than 0');
      return;
    }
    if (inputPrice > batch.mrp) {
      setErrorMessage(`Selling price (₹${inputPrice}) cannot exceed MRP (₹${batch.mrp})`);
      return;
    }

    const med = medicines.find((m) => m.id === selectedMedicineId);

    // Check if item already exists in cart for this batch
    const existingIndex = cart.findIndex((i) => i.batchId === batch.id);
    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newTotalQty = existing.quantity + inputQty;
      if (newTotalQty > batch.quantity) {
        setErrorMessage(`Cannot add ${inputQty} more. Total in cart would exceed stock (${batch.quantity})`);
        return;
      }
      setCart((prev) => {
        const copy = [...prev];
        copy[existingIndex].quantity = newTotalQty;
        return copy;
      });
    } else {
      const newItem: CartItem = {
        tempId: Math.random().toString(36).substring(2, 9),
        medicineId: selectedMedicineId,
        medicineName: med?.name || 'Medicine',
        packSize: med?.packSize || med?.unit,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        availableStock: batch.quantity,
        mrp: batch.mrp,
        gstPercentage: batch.gstPercentage || 12,
        quantity: inputQty,
        unitPrice: inputPrice,
        discountAmount: 0,
      };
      setCart((prev) => [...prev, newItem]);
    }

    // Reset selector
    setSelectedMedicineId(0);
    setSelectedBatchId(0);
    setInputQty(1);
    setInputPrice(0);
  };

  const handleUpdateCartQty = (tempId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.tempId === tempId) {
          const clamped = Math.max(1, Math.min(newQty, item.availableStock));
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (tempId: string) => {
    setCart((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  // Cart Calculations
  const computedSubtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const computedTax = cart.reduce((acc, item) => {
    const gross = item.quantity * item.unitPrice;
    return acc + (gross * item.gstPercentage) / 100;
  }, 0);
  const computedGrossTotal = computedSubtotal + computedTax;
  const netDiscount = Math.max(0, Number(discountAmount) || 0);
  const preRoundTotal = Math.max(0, computedGrossTotal - netDiscount);
  const computedRoundOff = Number((Math.round(preRoundTotal) - preRoundTotal).toFixed(2));
  const computedGrandTotal = Math.round(preRoundTotal);

  // Cash change calculation
  const cashChange = paymentMode === 'CASH' && tenderedAmount > computedGrandTotal 
    ? tenderedAmount - computedGrandTotal 
    : 0;

  // Selected customer object
  const activeCustomerObj = customers.find((c) => c.id === Number(selectedCustomerId));

  // Handle Checkout / Dispense
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (cart.length === 0) {
        throw new Error('Please add at least one medicine to the bill');
      }

      if (!customerName.trim()) {
        throw new Error('Customer name is required');
      }

      if (paymentMode === 'CREDIT' && isWalkIn) {
        throw new Error('Credit sales are only allowed for registered customers. Please select or register customer.');
      }

      if (paymentMode === 'CREDIT' && activeCustomerObj?.creditLimit) {
        const potentialBalance = activeCustomerObj.currentBalance + computedGrandTotal;
        if (potentialBalance > activeCustomerObj.creditLimit) {
          throw new Error(
            `Credit limit exceeded for ${activeCustomerObj.name}! Limit: ₹${activeCustomerObj.creditLimit}, Current: ₹${activeCustomerObj.currentBalance}, Bill: ₹${computedGrandTotal}`
          );
        }
      }

      const payload: CreateSaleRequest = {
        customerId: isWalkIn ? undefined : Number(selectedCustomerId),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        saleDate,
        paymentMode,
        paidAmount: paymentMode === 'CASH' 
          ? Math.min(tenderedAmount || computedGrandTotal, computedGrandTotal) 
          : (paymentMode === 'CREDIT' ? 0 : computedGrandTotal),
        discountAmount: netDiscount,
        roundOff: computedRoundOff,
        notes: notes.trim() || undefined,
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          batchId: i.batchId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: 0,
        })),
      };

      const created = await saleService.createSale(payload);
      setSuccessMessage(`Invoice "${created.invoiceNumber}" issued successfully! Stock deducted.`);
      setViewingSale(created);

      // Reset POS Cart
      setCart([]);
      setDiscountAmount(0);
      setTenderedAmount(0);
      setNotes('');
      if (isWalkIn) {
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setDoctorName('');
      }

      fetchSummary();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to generate sale bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Retail Pharmacy Billing &amp; Counter POS</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dispense medicines with FEFO batch selection, instant stock deduction, and tax receipts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Counter POS</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Invoices Ledger</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchSummary();
              if (activeTab === 'history') fetchSales();
            }}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Today's Sales Count</span>
            <span className="text-lg font-bold text-slate-900">{summary?.todaySalesCount || 0} bills</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Today's Revenue</span>
            <span className="text-lg font-bold text-slate-900">
              ₹{(summary?.todaySalesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Lifetime Sales Value</span>
            <span className="text-lg font-bold text-indigo-600">
              ₹{(summary?.totalSalesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Pending Customer Credit</span>
            <span className="text-lg font-bold text-amber-600">
              ₹{(summary?.totalDueAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* POS Tab */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer & Medicine Selection + Cart (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Details Panel */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient / Customer Info</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWalkIn(true);
                      setSelectedCustomerId('');
                      setCustomerName('Walk-in Customer');
                      setCustomerPhone('');
                      setDoctorName('');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      isWalkIn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Walk-in Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWalkIn(false);
                      if (customers.length > 0 && !selectedCustomerId) {
                        handleCustomerSelect(String(customers[0].id));
                      }
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      !isWalkIn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Registered Account
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {!isWalkIn ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Customer <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Choose Account --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Walk-in Customer"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prescribed Doctor</span>
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. A. K. Sharma"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {!isWalkIn && activeCustomerObj && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <span>
                      Credit Limit: <strong className="font-mono">₹{activeCustomerObj.creditLimit.toFixed(2)}</strong>
                    </span>
                    <span>
                      Current Balance: <strong className={`font-mono ${activeCustomerObj.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{activeCustomerObj.currentBalance.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                  {activeCustomerObj.creditLimit > 0 && activeCustomerObj.currentBalance >= activeCustomerObj.creditLimit && (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Credit Limit Exhausted
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Medicine & FEFO Batch Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Medicine &amp; Batch Quick Add (FEFO Priority)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                {/* Medicine Dropdown */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Medicine</label>
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value={0}>-- Search Medicine --</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.packSize || m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch Dropdown (FEFO) */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Batch (Stock &amp; Expiry)
                  </label>
                  <select
                    disabled={!selectedMedicineId || availableBatches.length === 0}
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono disabled:opacity-50"
                  >
                    {availableBatches.length === 0 ? (
                      <option value={0}>No Stock Available</option>
                    ) : (
                      availableBatches.map((b, idx) => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} (Qty: {b.quantity}, Exp: {b.expiryDate}){idx === 0 ? ' [FEFO]' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={inputQty}
                    onChange={(e) => setInputQty(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-right font-mono"
                  />
                </div>

                {/* Unit Price */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedMedicineId || !selectedBatchId}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Dispensing Cart Items ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/60 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Medicine &amp; Pack</th>
                      <th className="py-2.5 px-2">Batch # &amp; Exp</th>
                      <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                      <th className="py-2.5 px-2 text-right">Price (₹)</th>
                      <th className="py-2.5 px-2 text-right">MRP (₹)</th>
                      <th className="py-2.5 px-2 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <span>Cart is empty. Select medicines above to begin dispensing.</span>
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => {
                        const lineSub = item.quantity * item.unitPrice;
                        const lineTax = (lineSub * item.gstPercentage) / 100;
                        const lineTotal = lineSub + lineTax;

                        return (
                          <tr key={item.tempId} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                              {item.packSize && (
                                <span className="text-slate-400 text-[10px]">{item.packSize}</span>
                              )}
                            </td>

                            <td className="py-2 px-2">
                              <span className="font-mono font-bold text-slate-800 block text-[11px]">
                                {item.batchNumber}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">Exp: {item.expiryDate}</span>
                            </td>

                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.tempId, item.quantity - 1)}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-mono font-bold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQty(item.tempId, item.quantity + 1)}
                                  disabled={item.quantity >= item.availableStock}
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-2 px-2 text-right font-mono text-slate-800">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>

                            <td className="py-2 px-2 text-right font-mono text-slate-400 text-[11px]">
                              ₹{item.mrp.toFixed(2)}
                            </td>

                            <td className="py-2 px-2 text-right font-mono text-slate-500">
                              {item.gstPercentage}%
                            </td>

                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{lineTotal.toFixed(2)}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(item.tempId)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>

          {/* Right Column: Checkout & Billing Drawer (1 col) */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Invoice &amp; Settlement</span>
                </h3>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:bg-white"
                />
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">₹{computedSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Output Tax:</span>
                  <span className="font-mono">₹{computedTax.toFixed(2)}</span>
                </div>

                {/* Flat Discount Input */}
                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-24 px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                  />
                </div>

                {computedRoundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Round Off:</span>
                    <span className="font-mono">{computedRoundOff > 0 ? `+₹${computedRoundOff}` : `-₹${Math.abs(computedRoundOff)}`}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between items-baseline font-bold text-slate-900 border-t border-slate-200 pt-2 text-base">
                  <span>Net Payable:</span>
                  <span className="font-mono text-emerald-600 text-xl">₹{computedGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'UPI', 'CARD', 'CREDIT'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center space-x-1.5 ${
                        paymentMode === mode
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Tendered & Change */}
              {paymentMode === 'CASH' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Cash Tendered:</span>
                    <input
                      type="number"
                      min={0}
                      value={tenderedAmount || ''}
                      onChange={(e) => setTenderedAmount(Number(e.target.value))}
                      placeholder={String(computedGrandTotal)}
                      className="w-28 px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-right font-mono font-bold"
                    />
                  </div>
                  {tenderedAmount > computedGrandTotal && (
                    <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-slate-200 pt-1.5">
                      <span>Change to Return:</span>
                      <span className="font-mono text-sm">₹{cashChange.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Remarks / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. 1 strip BD after meals"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {/* Submit Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Generate Bill &amp; Dispense</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-400 text-center">
                Cashier: <strong className="text-slate-600">{user?.fullName || user?.username}</strong> &bull; Batch Stock Deducted Instantly
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full md:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice #, customer, doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="UNPAID">Unpaid (Credit)</option>
              </select>

              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
                <span>to</span>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {(searchQuery || statusFilter !== 'ALL' || historyStartDate || historyEndDate) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice # &amp; Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Prescribed Doctor</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading sales ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No sales records found.
                      </td>
                    </tr>
                  ) : (
                    sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{s.invoiceNumber}</span>
                          <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                            <Calendar className="w-3 h-3" />
                            <span>{s.saleDate}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{s.customerName}</span>
                          {s.customerPhone && (
                            <span className="font-mono text-[10px] text-slate-400 block">{s.customerPhone}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {s.doctorName || '—'}
                        </td>

                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                            {s.items?.length || 0}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          ₹{s.totalAmount.toFixed(2)}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700 block text-[11px]">{s.paymentMode}</span>
                          {s.changeAmount > 0 && (
                            <span className="text-slate-400 text-[10px] block">Chg: ₹{s.changeAmount.toFixed(2)}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {s.paymentStatus === 'PAID' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>PAID</span>
                            </span>
                          )}
                          {s.paymentStatus === 'PARTIAL' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>PARTIAL</span>
                            </span>
                          )}
                          {s.paymentStatus === 'UNPAID' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              <span>CREDIT</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingSale(s)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
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

      {/* Printable Pharmacy Receipt Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Retail Tax Invoice / Cash Memo
              </span>
              <button
                onClick={() => setViewingSale(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs font-sans space-y-3">
              {/* Pharmacy Shop Header */}
              <div className="text-center pb-2 border-b border-slate-200 space-y-0.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">MediLedger Pharmacy</h2>
                <p className="text-[10px] text-slate-500">Retail Medical Shop &bull; Regd D.L. No. DL-20B-MH-12345</p>
                <p className="text-[10px] text-slate-500">Main Road, Market Yard &bull; Phone: +91 98200 12345</p>
              </div>

              {/* Bill Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pb-2 border-b border-slate-200">
                <div>
                  <span>Bill No: </span>
                  <strong className="font-mono text-slate-900">{viewingSale.invoiceNumber}</strong>
                </div>
                <div className="text-right">
                  <span>Date: </span>
                  <strong className="text-slate-900">{viewingSale.saleDate}</strong>
                </div>
                <div>
                  <span>Patient: </span>
                  <strong className="text-slate-900">{viewingSale.customerName}</strong>
                </div>
                {viewingSale.doctorName && (
                  <div className="text-right">
                    <span>Dr: </span>
                    <strong className="text-slate-900">{viewingSale.doctorName}</strong>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-1.5 pb-2 border-b border-slate-200">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase">
                  <span className="col-span-6">Medicine (Batch)</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amt</span>
                </div>

                {viewingSale.items?.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 text-[11px] items-baseline">
                    <div className="col-span-6">
                      <span className="font-semibold text-slate-900 block truncate">{item.medicineName || 'Medicine'}</span>
                      <span className="text-[9px] text-slate-400 font-mono">B:{item.batchNumber} E:{item.expiryDate}</span>
                    </div>
                    <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                    <span className="col-span-2 text-right font-mono">₹{item.unitPrice.toFixed(2)}</span>
                    <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                      ₹{item.totalAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{viewingSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>GST Output Tax:</span>
                  <span className="font-mono">₹{viewingSale.taxAmount.toFixed(2)}</span>
                </div>
                {viewingSale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-[11px]">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{viewingSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {viewingSale.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>Round off:</span>
                    <span className="font-mono">{viewingSale.roundOff > 0 ? `+₹${viewingSale.roundOff}` : `-₹${Math.abs(viewingSale.roundOff)}`}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-700">₹{viewingSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                  <span>Paid ({viewingSale.paymentMode}):</span>
                  <span className="font-mono font-semibold">₹{viewingSale.paidAmount.toFixed(2)}</span>
                </div>
                {viewingSale.changeAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                    <span>Cash Returned:</span>
                    <span className="font-mono">₹{viewingSale.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200 space-y-0.5">
                <p>Thank you for visiting! Wishing you good health.</p>
                <p>Cashier: {viewingSale.createdBy} &bull; Computer Generated Invoice</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
