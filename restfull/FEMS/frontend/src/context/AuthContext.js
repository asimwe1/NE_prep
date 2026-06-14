import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('femcs_token');
    const stored = localStorage.getItem('femcs_user');
    if (!token || !stored) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      authAPI.validate().catch(() => {
        localStorage.removeItem('femcs_token');
        localStorage.removeItem('femcs_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } catch {
      localStorage.removeItem('femcs_token');
      localStorage.removeItem('femcs_user');
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('femcs_token', token);
    localStorage.setItem('femcs_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('femcs_token');
    localStorage.removeItem('femcs_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      setUser,
      isAdmin: user?.role === 'admin',
      isInspector: user?.role === 'inspector',
    }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
