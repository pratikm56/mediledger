import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/settingsService';
import type { UpdateBusinessSettingsRequest } from '../types/settings';
import {
  Settings,
  Building,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer,
  Receipt
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isOwner, isAdmin } = useAuth();
  const canEdit = isOwner || isAdmin;

  const [formData, setFormData] = useState<UpdateBusinessSettingsRequest>({
    shopName: 'MediLedger Pharmacy',
    ownerName: 'Dr. Rajesh Patel',
    shopAddress: 'Shop #12, Health Avenue, Medical Square',
    shopPhone: '+91 9876543210',
    shopEmail: 'contact@mediledger.local',
    gstin: '27AAAAA0000A1Z5',
    invoicePrefix: 'ML-INV-',
    invoiceCounter: '1001',
    currency: 'INR',
    currencySymbol: '₹',
    defaultGstRate: '12',
    invoiceFooter: 'Thank you for your visit. Get well soon!'
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const map = await settingsService.getSettings();
        setFormData({
          shopName: map.shop_name || 'MediLedger Pharmacy',
          ownerName: map.owner_name || '',
          shopAddress: map.shop_address || '',
          shopPhone: map.shop_phone || '',
          shopEmail: map.shop_email || '',
          gstin: map.gstin || '',
          invoicePrefix: map.invoice_prefix || 'ML-INV-',
          invoiceCounter: map.invoice_counter || '1001',
          currency: map.currency || 'INR',
          currencySymbol: map.currency_symbol || '₹',
          defaultGstRate: map.default_gst_rate || '12',
          invoiceFooter: map.invoice_footer || 'Thank you for your visit. Get well soon!'
        });
      } catch (err: unknown) {
        console.error('Failed to load settings', err);
        setErrorMessage('Failed to load business settings from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const updated = await settingsService.updateSettings(formData);
      setSuccessMessage('Pharmacy settings updated successfully and logged to audit trail.');
      setFormData((prev) => ({
        ...prev,
        shopName: updated.shop_name || prev.shopName,
        ownerName: updated.owner_name || prev.ownerName,
        shopAddress: updated.shop_address || prev.shopAddress,
        shopPhone: updated.shop_phone || prev.shopPhone,
        shopEmail: updated.shop_email || prev.shopEmail,
        gstin: updated.gstin || prev.gstin,
        invoicePrefix: updated.invoice_prefix || prev.invoicePrefix,
        invoiceCounter: updated.invoice_counter || prev.invoiceCounter,
        currency: updated.currency || prev.currency,
        currencySymbol: updated.currency_symbol || prev.currencySymbol,
        defaultGstRate: updated.default_gst_rate || prev.defaultGstRate,
        invoiceFooter: updated.invoice_footer || prev.invoiceFooter
      }));
    } catch (err: unknown) {
      console.error('Save failed', err);
      setErrorMessage('Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium text-xs">Loading pharmacy configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Settings className="w-3.5 h-3.5" />
              <span>Pharmacy Trade Profile &bull; Regulatory Master</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Business Settings &amp; POS Invoice Config</h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Configure store contact details, GSTIN, invoice numbering prefixes, and retail cash memo formatting.
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pharmacy Profile &amp; Tax Identifiers</h2>
              <p className="text-xs text-slate-500">Legal business entity identifiers printed on dispensary invoices</p>
            </div>
            {!canEdit && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                Read Only (Staff Role)
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Medical Shop Name *</span>
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  disabled={!canEdit}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Owner / Proprietor Name</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Store Address</label>
              <textarea
                name="shopAddress"
                rows={2}
                value={formData.shopAddress || ''}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Primary Contact Phone</span>
                </label>
                <input
                  type="text"
                  name="shopPhone"
                  value={formData.shopPhone || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>Primary Contact Email</span>
                </label>
                <input
                  type="email"
                  name="shopEmail"
                  value={formData.shopEmail || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  <span>GSTIN Number</span>
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl uppercase font-mono focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default GST Rate (%)</label>
                <input
                  type="text"
                  name="defaultGstRate"
                  value={formData.defaultGstRate || ''}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">POS Billing &amp; Counter Invoice Setup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={formData.invoicePrefix || ''}
                    onChange={handleChange}
                    disabled={!canEdit}
                    placeholder="ML-INV-"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency || ''}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    name="currencySymbol"
                    value={formData.currencySymbol || ''}
                    onChange={handleChange}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Footer Note</label>
              <input
                type="text"
                name="invoiceFooter"
                value={formData.invoiceFooter || ''}
                onChange={handleChange}
                disabled={!canEdit}
                placeholder="Printed message at the bottom of customer bills"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>

            {canEdit && (
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving Settings...' : 'Save Settings Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Live Bill Receipt Mockup */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-3">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Live Printed Cash Memo Preview</span>
            </div>

            {/* Thermal Print Slip Simulation */}
            <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm font-mono text-[11px] text-slate-800 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                <div className="font-bold text-xs uppercase text-slate-900">{formData.shopName}</div>
                {formData.ownerName && <div className="text-[10px] text-slate-500">Proprietor: {formData.ownerName}</div>}
                <div className="text-[10px] text-slate-600 max-w-xs mx-auto">{formData.shopAddress}</div>
                <div className="text-[10px] text-slate-600">Ph: {formData.shopPhone}</div>
                <div className="text-[10px] font-bold text-slate-700">GSTIN: {formData.gstin}</div>
              </div>

              <div className="flex justify-between text-[10px] border-b border-dashed border-slate-300 pb-2">
                <span>Inv: {formData.invoicePrefix}2026-0042</span>
                <span>Date: 07-Oct-2026</span>
              </div>

              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold">
                  <span>ITEM</span>
                  <span>QTY x RATE = TOTAL</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[10px]">
                  <span>1. Paracetamol 500mg</span>
                  <span>2 x {formData.currencySymbol}20.00 = {formData.currencySymbol}40.00</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[10px]">
                  <span>2. Amoxicillin 500mg</span>
                  <span>1 x {formData.currencySymbol}85.00 = {formData.currencySymbol}85.00</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-right">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>{formData.currencySymbol}125.00</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>GST ({formData.defaultGstRate}%):</span>
                  <span>{formData.currencySymbol}15.00</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-slate-900">{formData.currencySymbol}140.00</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 italic">
                {formData.invoiceFooter}
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Invoicing Security Guarantee</span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Invoices generated at the counter automatically embed these details for legal compliance and tax audit records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
