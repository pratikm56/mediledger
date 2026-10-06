import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { supplierService } from '../services/supplierService';
import type { Supplier, CreateSupplierRequest, UpdateSupplierRequest, SupplierOutstandingSummary } from '../types/partner';
import { 
  Building2, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Phone, 
  Mail, 
  RefreshCw, 
  Edit3, 
  FileText, 
  CreditCard,
  Building,
  ShieldCheck
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;
  const [, startTransition] = useTransition();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<SupplierOutstandingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [payablesOnly, setPayablesOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Modals & Feedback
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    drugLicenseNumber: '',
    openingBalance: 0,
    paymentTermsDays: 30,
  });

  const fetchSummary = async () => {
    try {
      const data = await supplierService.getOutstandingSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load supplier payables summary', err);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (payablesOnly) {
        const data = await supplierService.getSuppliersWithOutstanding(0, 50);
        setSuppliers(data.content);
      } else {
        const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
        const data = await supplierService.searchSuppliers(searchQuery, activeParam, 0, 50);
        setSuppliers(data.content);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch supplier directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [searchQuery, payablesOnly, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      drugLicenseNumber: '',
      openingBalance: 0,
      paymentTermsDays: 30,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      gstNumber: supplier.gstNumber || '',
      drugLicenseNumber: supplier.drugLicenseNumber || '',
      paymentTermsDays: supplier.paymentTermsDays,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingSupplier) {
        const updatePayload: UpdateSupplierRequest = {
          name: formData.name,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          gstNumber: formData.gstNumber,
          drugLicenseNumber: formData.drugLicenseNumber,
          paymentTermsDays: formData.paymentTermsDays || 30,
        };
        const updated = await supplierService.updateSupplier(editingSupplier.id, updatePayload);
        setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setSuccessMessage(`Supplier "${updated.name}" updated successfully!`);
      } else {
        const created = await supplierService.createSupplier(formData);
        setSuccessMessage(`Supplier "${created.name}" registered successfully!`);
        fetchSuppliers();
        fetchSummary();
      }
      setShowAddModal(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save supplier profile');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to ${supplier.active ? 'deactivate' : 'activate'} "${supplier.name}"?`)) {
      return;
    }

    try {
      const updated = await supplierService.toggleSupplierStatus(supplier.id);
      setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSuccessMessage(`Supplier "${updated.name}" status updated.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle supplier status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Pharmaceutical Suppliers &amp; Distributors</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage wholesale distributors, drug licenses, GSTIN credentials, and outstanding payables
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchSuppliers();
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
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Registered Vendors</span>
            <span className="text-lg font-bold text-slate-900">{suppliers.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Vendors with Due Payables</span>
            <span className="text-lg font-bold text-amber-600">
              {summary?.totalSuppliersWithOutstanding || 0} distributors
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Outstanding Payables</span>
            <span className="text-lg font-bold text-rose-600">
              ₹{(summary?.totalPayablesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by distributor name, contact person, phone, or GST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <input
              type="checkbox"
              checked={payablesOnly}
              onChange={(e) => setPayablesOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="font-semibold text-rose-700">Pending Payables Only</span>
          </label>

          <select
            value={statusFilter}
            onChange={(e) => {
              startTransition(() => {
                setStatusFilter(e.target.value as any);
              });
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="all">All Status</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Distributor Company</th>
                <th className="py-3 px-4">Contact Person &amp; Phone</th>
                <th className="py-3 px-4">GSTIN &amp; Drug License</th>
                <th className="py-3 px-4">Credit Terms</th>
                <th className="py-3 px-4">Current Payable Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading distributor directory...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No suppliers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        {s.address && (
                          <span className="text-slate-400 text-[10px] block truncate max-w-xs">{s.address}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{s.contactPerson || '—'}</span>
                      <div className="flex items-center space-x-1 text-slate-600 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                      {s.email && (
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                          <Mail className="w-3 h-3" />
                          <span>{s.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 space-y-0.5">
                      {s.gstNumber && (
                        <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-700">
                          <span className="text-[9px] px-1 py-0.2 bg-slate-100 text-slate-500 rounded font-bold">GST</span>
                          <span>{s.gstNumber}</span>
                        </div>
                      )}
                      {s.drugLicenseNumber && (
                        <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{s.drugLicenseNumber}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{s.paymentTermsDays} days</span>
                      <span className="text-slate-400 block text-[10px]">credit period</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {s.currentBalance > 0 ? (
                        <span className="text-rose-600">
                          ₹{s.currentBalance.toFixed(2)}
                          <span className="text-[10px] block font-normal text-rose-400">Payable Due</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600">
                          ₹0.00
                          <span className="text-[10px] block font-normal text-emerald-400">Paid / Nil</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {s.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          INACTIVE
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                              s.active
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {s.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Register New Pharmaceutical Distributor'}
                </h3>
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

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metro Pharma Agency"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Chawla"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="15-character GSTIN"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drug License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-20B-MH-12345"
                    value={formData.drugLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, drugLicenseNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                {!editingSupplier && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Payable Balance (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse / Office Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, pharma market, city..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

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
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
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
