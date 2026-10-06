import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user?.roles.some((role) =>
      allowedRoles.some((allowed) => {
        const normAllowed = allowed.startsWith('ROLE_') ? allowed : `ROLE_${allowed}`;
        return role === normAllowed;
      })
    );

    if (!hasPermission) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-rose-200 text-center shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-xs text-slate-600 mb-6">
              Your account ({user?.roles.join(', ')}) does not have permission to view this section.
              Please contact the shop owner or administrator for access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
