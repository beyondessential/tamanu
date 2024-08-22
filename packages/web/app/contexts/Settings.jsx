import React, { useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const SettingsContext = React.createContext({
  getSetting: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
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
