import React, { useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const overrides = {}; // add keys to this object to help with development

const SettingsContext = React.createContext({
  getSetting: () => {},
  fetchSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});

//   useEffect(() => {
//     setSettings({ ...reduxLocalisation, ...overrides });
//   }, [reduxLocalisation]);

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