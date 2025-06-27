import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { useApi } from '../api/useApi';

export const AuthProvider = ({ children }) => {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    const response = await api.login(email, password);
    setUser(response.user);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await api.logout();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};
