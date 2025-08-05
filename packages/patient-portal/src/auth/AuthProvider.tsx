import React, { useState } from 'react';
import { AuthContext } from './AuthContext';
import { useApi } from '../api/useApi';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useApi();
  const [user, setUser] = useState<any | null>(null); // Using any for now
  const [loading, setLoading] = useState(false);

  const login = async (email: string) => {
    if (!api) throw new Error('API not available');
    setLoading(true);
    try {
      // empty password for now, update when we have full registration flow
      const response = await api.login(email);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!api) throw new Error('API not available');
    setLoading(true);
    try {
      // Note: TamanuApi doesn't have a logout method, so we'll just clear the user
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};
