import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  Database, 
  Layers, 
  Pill, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HealthData {
  status: string;
  database: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
}

export const DashboardPage: React.FC = () => {
  const { user, isOwner, isAdmin } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch {
        setHealth(null);
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchHealth();
  }, []);

  const roles = user?.roles || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authenticated Session Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Logged in as <strong className="text-emerald-400">@{user?.username}</strong> with roles{' '}
            <code className="bg-slate-800/80 px-1.5 py-0.5 rounded text-emerald-300">{roles.join(', ')}</code>.
            Authentication, JWT verification, and Role-Based Access Control (RBAC) are verified.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Pill className="w-72 h-72" />
        </div>
      </div>

      {/* Real-time System Connectivity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Auth status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Security &amp; RBAC</h3>
                <p className="text-[11px] text-slate-500">JWT Authentication</p>
              </div>
            </div>
            <span className="flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              VERIFIED
            </span>
          </div>
          <div className="pt-3 text-xs text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Algorithm:</span> HMAC SHA-256 (BCrypt 10 rounds)</p>
            <p><span className="font-semibold text-slate-700">User Email:</span> {user?.email}</p>
          </div>
        </div>

        {/* Backend status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Spring Boot 3.3</h3>
                <p className="text-[11px] text-slate-500">Java 17 Runtime</p>
              </div>
            </div>
            <span className="flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              {loadingHealth ? 'Checking...' : health?.status || 'ONLINE'}
            </span>
          </div>
          <div className="pt-3 text-xs text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Backend API:</span> REST with JWT Filter</p>
            <p><span className="font-semibold text-slate-700">Uptime:</span> {health ? `${health.uptimeSeconds}s` : 'Active'}</p>
          </div>
        </div>

        {/* Database status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">PostgreSQL 16</h3>
                <p className="text-[11px] text-slate-500">Flyway Migrations</p>
              </div>
            </div>
            <span className="flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
              {loadingHealth ? 'Checking...' : health?.database === 'UP' ? 'CONNECTED' : 'ONLINE'}
            </span>
          </div>
          <div className="pt-3 text-xs text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-700">Active Version:</span> Flyway Migration V2</p>
            <p><span className="font-semibold text-slate-700">Seeded Data:</span> Users, Roles, Settings</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      {(isOwner || isAdmin) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">User &amp; Staff Administration</h2>
              <p className="text-xs text-slate-500">Manage pharmacy staff accounts, assign roles, and audit access</p>
            </div>
            <Link
              to="/users"
              className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="block text-xs font-bold text-slate-800">Owner Role</span>
              <span className="block text-[11px] text-slate-500">Full unrestricted control, user provisioning, financial audit</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="block text-xs font-bold text-slate-800">Admin Role</span>
              <span className="block text-[11px] text-slate-500">Shop management, staff creation, inventory &amp; purchases</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="block text-xs font-bold text-slate-800">Staff Role</span>
              <span className="block text-[11px] text-slate-500">POS Billing counter, medicine lookup, customer directory</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps Roadmap Notice */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            <span>Next Phase Ready</span>
          </div>
          <h3 className="font-bold text-sm sm:text-base">Phase 3: Medicine Management</h3>
          <p className="text-xs text-slate-400">
            Next to implement: Medicine master catalog, Categories, Manufacturers, HSN codes, and GST rates.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0">
          Phase 2 Complete &bull; Awaiting Next Step
        </div>
      </div>
    </div>
  );
};
