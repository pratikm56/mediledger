import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Building2, 
  TrendingUp, 
  Settings, 
  ShieldCheck, 
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isOwner, isAdmin } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true, allowed: true },
    { name: 'Billing / POS', to: '/billing', icon: Receipt, exact: false, allowed: true, badge: 'Phase 7' },
    { name: 'Medicines', to: '/medicines', icon: Pill, exact: false, allowed: true },
    { name: 'Inventory & Batches', to: '/inventory', icon: Package, exact: false, allowed: true },
    { name: 'Purchases', to: '/purchases', icon: ShoppingCart, exact: false, allowed: isOwner || isAdmin },
    { name: 'Customers', to: '/customers', icon: Users, exact: false, allowed: true },
    { name: 'Suppliers', to: '/suppliers', icon: Building2, exact: false, allowed: true },
    { name: 'Reports & Profit', to: '/reports', icon: TrendingUp, exact: false, allowed: isOwner || isAdmin, badge: 'Phase 8-10' },
    { name: 'User Management', to: '/users', icon: ShieldCheck, exact: false, allowed: isOwner || isAdmin },
    { name: 'Shop Settings', to: '/settings', icon: Settings, exact: false, allowed: isOwner || isAdmin, badge: 'Phase 11' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity" 
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">Medi<span className="text-emerald-400">Ledger</span></span>
              <span className="block text-[10px] text-slate-400">Pharmacy POS</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navigationItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.exact}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Single Shop Edition</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              MediLedger v1.0.0 &bull; Phase 6 Inward Purchases Active
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
