import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const getPrimaryRole = (): string => {
    if (!user || !user.roles || user.roles.length === 0) return 'STAFF';
    if (user.roles.includes('ROLE_OWNER')) return 'OWNER';
    if (user.roles.includes('ROLE_ADMIN')) return 'ADMIN';
    return 'STAFF';
  };

  const role = getPrimaryRole();

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const handleLogout = async () => {
    setShowConfirmLogout(false);
    await logout();
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-slate-800">Pharmacy Operations Console</h2>
            <p className="text-[11px] text-slate-500">Retail Medical Billing &amp; Batch Inventory</p>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-900">{user?.fullName || user?.username}</span>
              <div className="flex items-center justify-end space-x-1">
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
                <span className="text-[10px] text-slate-400">@{user?.username}</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600">
              <UserIcon className="w-4 h-4" />
            </div>

            <button
              onClick={() => setShowConfirmLogout(true)}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to end your current MediLedger session?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className="py-2 px-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-3 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
