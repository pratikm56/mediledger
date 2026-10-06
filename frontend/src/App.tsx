import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Pill, 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3, 
  ShieldCheck, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface SystemHealth {
  status: string;
  database: string;
  version: string;
  timestamp: string;
  uptimeSeconds?: number;
  environment?: string;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiBaseUrl}/health`, { timeout: 4000 });
      setHealth(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Unable to connect to backend server');
      } else {
        setError('Unexpected error occurred');
      }
      setHealth(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const modules = [
    { name: 'Phase 1: Foundation', desc: 'React, Spring Boot, PostgreSQL, Docker, Flyway', status: 'In Verification', icon: Layers, active: true },
    { name: 'Phase 2: Authentication', desc: 'JWT Auth, Roles (OWNER, ADMIN, STAFF), BCrypt', status: 'Pending', icon: ShieldCheck, active: false },
    { name: 'Phase 3: Medicine Management', desc: 'Medicines, Categories, Manufacturers CRUD', status: 'Pending', icon: Pill, active: false },
    { name: 'Phase 4: Batch & Inventory', desc: 'Batches, Expiry, Stock Transactions, Valuations', status: 'Pending', icon: Package, active: false },
    { name: 'Phase 5: Customers & Suppliers', desc: 'Parties, Contact Info, Opening Balances', status: 'Pending', icon: Users, active: false },
    { name: 'Phase 6: Purchase Management', desc: 'Supplier Purchases, Batch Additions, Stock IN', status: 'Pending', icon: ShoppingCart, active: false },
    { name: 'Phase 7: Sales & Billing', desc: 'POS Checkout, Batch Selection, Stock OUT, Invoices', status: 'Pending', icon: Activity, active: false },
    { name: 'Phase 8-10: Reports & Dashboard', desc: 'Stock Summary, Detailed Reports, P&L Analytics', status: 'Pending', icon: BarChart3, active: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Medi<span className="text-emerald-600">Ledger</span></span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">Phase 1 Foundation</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Refresh Status</span>
            </button>
            <span className="text-xs text-slate-500">
              {lastChecked.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pharmacy Billing & Inventory Core Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Medical Shop Management & Billing System
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Engineered with modern, enterprise-grade architecture: Spring Boot 3 (Java 17), 
              PostgreSQL, Flyway migrations, Docker containerization, and React with TypeScript & Tailwind CSS.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
            <Pill className="w-96 h-96" />
          </div>
        </div>

        {/* System Connectivity Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* React Frontend */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Frontend Layer</h3>
                  <p className="text-xs text-slate-500">React + Vite + TS</p>
                </div>
              </div>
              <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="pt-4 text-xs text-slate-600 space-y-1">
              <p><span className="font-medium text-slate-700">UI Stack:</span> React 18 / Tailwind CSS</p>
              <p><span className="font-medium text-slate-700">API Endpoint:</span> <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">{apiBaseUrl}</code></p>
            </div>
          </div>

          {/* Spring Boot Backend */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Backend Engine</h3>
                  <p className="text-xs text-slate-500">Spring Boot (Java 17)</p>
                </div>
              </div>
              {loading ? (
                <span className="text-xs font-medium text-slate-500">Connecting...</span>
              ) : health?.status === 'UP' ? (
                <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  ONLINE
                </span>
              ) : (
                <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  STANDBY
                </span>
              )}
            </div>
            <div className="pt-4 text-xs text-slate-600 space-y-1">
              <p><span className="font-medium text-slate-700">Framework:</span> Spring Boot 3.3.4</p>
              <p><span className="font-medium text-slate-700">Status:</span> {health ? health.status : (error ? 'Backend starting / checking' : 'Connecting...')}</p>
            </div>
          </div>

          {/* PostgreSQL Database */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">PostgreSQL DB</h3>
                  <p className="text-xs text-slate-500">Docker / Aiven Cloud</p>
                </div>
              </div>
              {loading ? (
                <span className="text-xs font-medium text-slate-500">Checking...</span>
              ) : health?.database === 'UP' ? (
                <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                  CONNECTED
                </span>
              ) : (
                <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  PENDING DB
                </span>
              )}
            </div>
            <div className="pt-4 text-xs text-slate-600 space-y-1">
              <p><span className="font-medium text-slate-700">Migration Tool:</span> Flyway</p>
              <p><span className="font-medium text-slate-700">Database Engine:</span> PostgreSQL 16</p>
            </div>
          </div>
        </div>

        {/* Phase Roadmap Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Project Implementation Roadmap</h2>
              <p className="text-xs text-slate-500">Phased delivery following strict architecture & quality guidelines</p>
            </div>
            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Phase 1 in progress
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border transition-all ${
                    mod.active 
                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${mod.active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      mod.active 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {mod.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">{mod.name}</h4>
                  <p className="text-xs text-slate-500 leading-snug">{mod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture Note */}
        <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-semibold text-sm">Phase 1 Foundation Setup</h4>
            <p className="text-xs text-slate-400">
              Strict separation of concerns: Controllers, Services, Repositories, Entities, DTOs, Mappers, Security, Exception Handlers.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400">
            <span>Clean Architecture Enabled</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          MediLedger &copy; {new Date().getFullYear()} — Medical Shop Management &amp; Billing System. Phase 1 Architecture Foundation.
        </div>
      </footer>
    </div>
  );
};

export default App;
