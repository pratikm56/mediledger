import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/customerService';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerOutstandingSummary } from '../types/partner';
import { 
  Users, 
  UserPlus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Phone, 
  Mail, 
  RefreshCw, 
  Edit3, 
  Stethoscope, 
  CreditCard,
  Building,
  UserCheck
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const [, startTransition] = useTransition();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerOutstandingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outstandingOnly, setOutstandingOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Modals & Feedback
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    doctorName: '',
    gstNumber: '',
    openingBalance: 0,
    creditLimit: 0,
  });

  const fetchSummary = async () => {
    try {
      const data = await customerService.getOutstandingSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load receivables summary', err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (outstandingOnly) {
        const data = await customerService.getCustomersWithOutstanding(0, 50);
        setCustomers(data.content);
      } else {
        const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
        const data = await customerService.searchCustomers(searchQuery, activeParam, 0, 50);
        setCustomers(data.content);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, outstandingOnly, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      doctorName: '',
      gstNumber: '',
      openingBalance: 0,
      creditLimit: 1000,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      doctorName: customer.doctorName || '',
      gstNumber: customer.gstNumber || '',
      creditLimit: customer.creditLimit,
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingCustomer) {
        const updatePayload: UpdateCustomerRequest = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          doctorName: formData.doctorName,
          gstNumber: formData.gstNumber,
          creditLimit: formData.creditLimit,
        };
        const updated = await customerService.updateCustomer(editingCustomer.id, updatePayload);
        setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSuccessMessage(`Customer profile for "${updated.name}" updated!`);
      } else {
        const created = await customerService.createCustomer(formData);
        setSuccessMessage(`Customer "${created.name}" registered successfully!`);
        fetchCustomers();
        fetchSummary();
      }
      setShowAddModal(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to ${customer.active ? 'deactivate' : 'activate'} "${customer.name}"?`)) {
      return;
    }

    try {
      const updated = await customerService.toggleCustomerStatus(customer.id);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSuccessMessage(`Customer "${updated.name}" status updated.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customer &amp; Patient Directory</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage pharmacy retail customers, patient doctor references, and credit accounts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchCustomers();
              fetchSummary();
            }}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
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

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Registered Profiles</span>
            <span className="text-lg font-bold text-slate-900">{customers.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Pending Due Accounts</span>
            <span className="text-lg font-bold text-amber-600">
              {summary?.totalCustomersWithOutstanding || 0} customers
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Receivables</span>
            <span className="text-lg font-bold text-rose-600">
              ₹{(summary?.totalReceivablesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            placeholder="Search by customer name, phone number, or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <input
              type="checkbox"
              checked={outstandingOnly}
              onChange={(e) => setOutstandingOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <span className="font-semibold text-rose-700">Outstanding Balance Only</span>
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

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Prescribing Doctor</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Current Due (Balance)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading customer profiles...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        {c.address && (
                          <span className="text-slate-400 text-[10px] block truncate max-w-xs">{c.address}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center space-x-1 text-slate-400 text-[10px]">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {c.doctorName ? (
                        <span className="inline-flex items-center space-x-1 text-slate-700 font-medium">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          <span>{c.doctorName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Direct Counter</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      ₹{c.creditLimit.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {c.currentBalance > 0 ? (
                        <span className="text-rose-600">
                          ₹{c.currentBalance.toFixed(2)}
                          <span className="text-[10px] block font-normal text-rose-400">Due (Receivable)</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600">
                          ₹0.00
                          <span className="text-[10px] block font-normal text-emerald-400">Clear</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {c.active ? (
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
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Customer Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {(isOwner || isAdmin) && (
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                              c.active
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Register New Customer'}
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

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer / Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribing Doctor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. K. Gupta"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. patient@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                {!editingCustomer && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Due Balance (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, area, landmark..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  {formSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{editingCustomer ? 'Update Profile' : 'Save Customer'}</span>
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
