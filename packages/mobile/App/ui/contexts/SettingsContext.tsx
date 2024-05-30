import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { get } from 'lodash';

interface SettingsContextData {
  getSetting<T>(key: string): T | undefined;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { settings: authSettings } = useAuth();
  const [settings, setSettings] = useState({});

  useEffect(() => {
    setSettings(authSettings);
  }, [authSettings]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(settings, path),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
