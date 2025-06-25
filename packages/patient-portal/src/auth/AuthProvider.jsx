import { useState } from 'react';
import { TamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';
import { AuthContext } from './AuthContext';

const api = new TamanuApi({
  endpoint: import.meta.env.VITE_API_TARGET,
  agentName: 'patient-portal',
  agentVersion: import.meta.env.VITE_APP_VERSION,
  deviceId: getDeviceId(),
});

export const AuthProvider = ({ children }) => {
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
