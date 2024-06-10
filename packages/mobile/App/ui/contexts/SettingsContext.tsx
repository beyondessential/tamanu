import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { get } from 'lodash';

interface SettingsContextData {
  getSetting<T>(key: string): T | undefined;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const { settings: authSettings } = useAuth();

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(authSettings, path),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
