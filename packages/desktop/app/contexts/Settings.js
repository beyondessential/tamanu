import React, { useState, useContext } from 'react';
import { get } from 'lodash';
import { useApi } from '../api';

const SettingsContext = React.createContext({
  getSetting: () => {},
  fetchSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const api = useApi();
  const [settings, setSettings] = useState({});

  const fetchSettings = async () => {
    const settingsObject = await api.get('settings');
    console.log('settingsObject', settingsObject);
    setSettings(settingsObject);
  };

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(settings, path),
        fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
