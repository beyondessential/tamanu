import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const SettingsContext = React.createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings has been called outside a SettingsProvider.');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const reduxSettings = useSelector(state => state.auth.settings);

  useEffect(() => {
    setSettings(reduxSettings);
  }, [reduxSettings]);

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
