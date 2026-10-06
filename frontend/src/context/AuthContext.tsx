import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mediledger_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mediledger_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('mediledger_token');
      if (storedToken) {
        try {
          const freshUser = await authService.getCurrentUser();
          setUser(freshUser);
          localStorage.setItem('mediledger_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('mediledger_token');
          localStorage.removeItem('mediledger_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<LoginResponse> => {
    const res = await authService.login(usernameOrEmail, password);
    localStorage.setItem('mediledger_token', res.token);
    localStorage.setItem('mediledger_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return user.roles.includes(normalized);
  };

  const isOwner = hasRole('ROLE_OWNER');
  const isAdmin = hasRole('ROLE_ADMIN');
  const isStaff = hasRole('ROLE_STAFF');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isOwner,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
