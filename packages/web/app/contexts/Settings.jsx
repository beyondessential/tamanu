import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get, has } from 'lodash';

const SettingsContext = React.createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings has been called outside a SettingsProvider.');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const reduxSettings = useSelector(state => state.auth.settings);

  useEffect(() => {
    setSettings(reduxSettings);
  }, [reduxSettings]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => {
          console.log(settings);

          if (!has(settings, path)) {
            throw new Error(`Settings reader called with invalid path: ${path}`);
          }

          return get(settings, path);
        },
        getSettingExists: path => has(settings, path),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
