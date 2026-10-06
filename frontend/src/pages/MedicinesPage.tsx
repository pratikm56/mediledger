import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { medicineService } from '../services/medicineService';
import { categoryService } from '../services/categoryService';
import { manufacturerService } from '../services/manufacturerService';
import type { 
  Medicine, 
  Category, 
  Manufacturer, 
  CreateMedicineData, 
  UpdateMedicineData,
  CreateCategoryData,
  CreateManufacturerData
} from '../types/medicine';
import { 
  Pill, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Edit3, 
  FolderPlus, 
  Building2, 
  RefreshCw, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  SlidersHorizontal,
  PackageCheck
} from 'lucide-react';

export const MedicinesPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canManage = isOwner || isAdmin;
  const [, startTransition] = useTransition();

  // Data states
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showManufacturerModal, setShowManufacturerModal] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState<CreateMedicineData>({
    name: '',
    genericName: '',
    categoryId: 0,
    manufacturerId: 0,
    hsnCode: '300490',
    gstPercentage: 12.00,
    unit: 'Strip',
    packSize: '10 Tablets',
    prescriptionRequired: false,
    minimumStock: 15,
    description: '',
  });

  // Category Quick Form State
  const [catFormData, setCatFormData] = useState<CreateCategoryData>({ name: '', description: '' });
  // Manufacturer Quick Form State
  const [mfrFormData, setMfrFormData] = useState<CreateManufacturerData>({
    name: '',
    contact: '',
    email: '',
    address: '',
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Categories & Manufacturers
  const loadDependencies = async () => {
    try {
      const [cats, mfrs] = await Promise.all([
        categoryService.getCategories(true),
        manufacturerService.getManufacturers(true),
      ]);
      setCategories(cats);
      setManufacturers(mfrs);

      // Default dropdown selection if not set
      if (cats.length > 0 && formData.categoryId === 0) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
      if (mfrs.length > 0 && formData.manufacturerId === 0) {
        setFormData((prev) => ({ ...prev, manufacturerId: mfrs[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load categories or manufacturers', err);
    }
  };

  // Load Medicines
  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
      const catParam = selectedCategory ? Number(selectedCategory) : undefined;
      const mfrParam = selectedManufacturer ? Number(selectedManufacturer) : undefined;

      const data = await medicineService.searchMedicines({
        query: searchQuery,
        categoryId: catParam,
        manufacturerId: mfrParam,
        activeOnly: activeParam,
        page,
        size: 15,
        sort: 'name,asc',
      });

      setMedicines(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch medicines catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchMedicines();
  }, [page, statusFilter, selectedCategory, selectedManufacturer]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchMedicines();
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setFormError(null);
    setFormData({
      name: '',
      genericName: '',
      categoryId: categories.length > 0 ? categories[0].id : 0,
      manufacturerId: manufacturers.length > 0 ? manufacturers[0].id : 0,
      hsnCode: '300490',
      gstPercentage: 12.00,
      unit: 'Strip',
      packSize: '10 Tablets',
      prescriptionRequired: false,
      minimumStock: 15,
      description: '',
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (med: Medicine) => {
    setEditingMedicine(med);
    setFormError(null);
    setFormData({
      name: med.name,
      genericName: med.genericName || '',
      categoryId: med.categoryId,
      manufacturerId: med.manufacturerId || 0,
      hsnCode: med.hsnCode || '300490',
      gstPercentage: med.gstPercentage,
      unit: med.unit,
      packSize: med.packSize || '',
      prescriptionRequired: med.prescriptionRequired,
      minimumStock: med.minimumStock,
      description: med.description || '',
    });
    setShowAddModal(true);
  };

  // Save Medicine (Create or Update)
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingMedicine) {
        const updatePayload: UpdateMedicineData = {
          ...formData,
          active: editingMedicine.active,
        };
        const updated = await medicineService.updateMedicine(editingMedicine.id, updatePayload);
        setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setSuccessMessage(`Medicine "${updated.name}" updated successfully!`);
      } else {
        const created = await medicineService.createMedicine(formData);
        setSuccessMessage(`Medicine "${created.name}" created successfully!`);
        fetchMedicines();
      }
      setShowAddModal(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save medicine record');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Soft Toggle Medicine Status
  const handleToggleStatus = async (med: Medicine) => {
    const actionText = med.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} "${med.name}"?`)) {
      return;
    }

    try {
      const updated = await medicineService.toggleMedicineStatus(med.id);
      setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSuccessMessage(`Medicine "${updated.name}" is now ${updated.active ? 'ACTIVE' : 'INACTIVE'}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not update medicine status');
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const newCat = await categoryService.createCategory(catFormData);
      setCategories((prev) => [...prev, newCat]);
      setCatFormData({ name: '', description: '' });
      setSuccessMessage(`Category "${newCat.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Category
  const handleToggleCategory = async (cat: Category) => {
    try {
      const updated = await categoryService.toggleCategoryStatus(cat.id);
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle category');
    }
  };

  // Create Manufacturer
  const handleCreateManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const newMfr = await manufacturerService.createManufacturer(mfrFormData);
      setManufacturers((prev) => [...prev, newMfr]);
      setMfrFormData({ name: '', contact: '', email: '', address: '' });
      setSuccessMessage(`Manufacturer "${newMfr.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create manufacturer');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Manufacturer
  const handleToggleManufacturer = async (mfr: Manufacturer) => {
    try {
      const updated = await manufacturerService.toggleManufacturerStatus(mfr.id);
      setManufacturers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle manufacturer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Pill className="w-6 h-6 text-emerald-600" />
            <span>Medicine Master Catalog</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage pharmaceutical products, categories, manufacturers, HSN codes &amp; GST rates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setShowManufacturerModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Manufacturers ({manufacturers.length})</span>
          </button>
          <button
            onClick={fetchMedicines}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Catalog</span>
            <span className="text-lg font-bold text-slate-900">{totalElements}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Categories</span>
            <span className="text-lg font-bold text-slate-900">{categories.filter(c => c.active).length} Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Manufacturers</span>
            <span className="text-lg font-bold text-slate-900">{manufacturers.filter(m => m.active).length} Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Rx Schedule</span>
            <span className="text-lg font-bold text-slate-900">
              {medicines.filter(m => m.prescriptionRequired).length} on page
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine by brand name or generic compound (e.g. Paracetamol, Dolo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                startTransition(() => {
                  setSelectedCategory(e.target.value);
                  setPage(0);
                });
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedManufacturer}
              onChange={(e) => {
                startTransition(() => {
                  setSelectedManufacturer(e.target.value);
                  setPage(0);
                });
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                startTransition(() => {
                  setStatusFilter(e.target.value as any);
                  setPage(0);
                });
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="all">All Status</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </form>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Medicine &amp; Generic</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Packaging &amp; Unit</th>
                <th className="py-3 px-4">HSN / GST</th>
                <th className="py-3 px-4">Min Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading medicine catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No medicines found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Generic */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{m.name}</span>
                          {m.prescriptionRequired && (
                            <span 
                              title="Prescription Required (Schedule Drug)"
                              className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-tighter"
                            >
                              Rx
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[11px] block italic">
                          {m.genericName || 'No generic name'}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {m.categoryName}
                      </span>
                    </td>

                    {/* Manufacturer */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {m.manufacturerName || '—'}
                    </td>

                    {/* Packaging */}
                    <td className="py-3 px-4 text-slate-600">
                      <span>{m.packSize || '1'}</span>
                      <span className="text-slate-400 block text-[10px]">{m.unit}</span>
                    </td>

                    {/* HSN & GST */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-slate-700 block">{m.hsnCode || '—'}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {m.gstPercentage}% GST
                      </span>
                    </td>

                    {/* Min Stock */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{m.minimumStock}</span>
                      <span className="text-[10px] text-slate-400 block">units threshold</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {m.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1"></span>
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {canManage && (
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Medicine"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => handleToggleStatus(m)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                              m.active
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {m.active ? 'Deactivate' : 'Activate'}
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

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{medicines.length}</span> of{' '}
            <span className="font-bold">{totalElements}</span> medicines (Page {page + 1} of {totalPages || 1})
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0 || loading}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1 || loading}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingMedicine ? `Edit Medicine: ${editingMedicine.name}` : 'Add New Medicine to Catalog'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMedicine} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medicine / Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dolo 650"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Generic Chemical Formula
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol 650mg"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.filter(c => c.active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacturer / Company <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.manufacturerId}
                    onChange={(e) => setFormData({ ...formData, manufacturerId: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="" disabled>Select Manufacturer</option>
                    {manufacturers.filter(m => m.active).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strip, Bottle"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Tablets"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    placeholder="300490"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST % Rate</label>
                  <select
                    value={formData.gstPercentage}
                    onChange={(e) => setFormData({ ...formData, gstPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Reorder Stock (Threshold)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prescriptionRequired}
                      onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Prescription Required (Schedule H/H1)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Usage instructions, storage temperature conditions, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                    <span>{editingMedicine ? 'Update Medicine' : 'Save Medicine'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Manage Dosage Categories</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {canManage && (
              <form onSubmit={handleCreateCategory} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Add New Category</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Category name (e.g. Injections)"
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {categories.map((c) => (
                <div key={c.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    {c.description && <span className="text-slate-400 text-[10px] block">{c.description}</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">{c.medicineCount || 0} products</span>
                    {canManage && (
                      <button
                        onClick={() => handleToggleCategory(c)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                          c.active ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manufacturer Management Modal */}
      {showManufacturerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Manage Pharma Manufacturers</h3>
              </div>
              <button
                onClick={() => setShowManufacturerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {canManage && (
              <form onSubmit={handleCreateManufacturer} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Add New Manufacturer</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Manufacturer name"
                    value={mfrFormData.name}
                    onChange={(e) => setMfrFormData({ ...mfrFormData, name: e.target.value })}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="text"
                    placeholder="Contact number"
                    value={mfrFormData.contact}
                    onChange={(e) => setMfrFormData({ ...mfrFormData, contact: e.target.value })}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Add Manufacturer
                  </button>
                </div>
              </form>
            )}

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {manufacturers.map((m) => (
                <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    <span className="text-slate-400 text-[10px] block">{m.contact || m.email || 'No contact info'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">{m.medicineCount || 0} products</span>
                    {canManage && (
                      <button
                        onClick={() => handleToggleManufacturer(m)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                          m.active ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        {m.active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
