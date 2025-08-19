import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

/**
 * @typedef {import("@tamanu/settings/types").FrontEndExposedSettingPath} SettingPath
 * @typedef {Object} SettingsContextType
 * @property {(path: SettingPath) => ?} getSetting
 */

/** @type {React.Context<SettingsContextType | undefined>} */
export const SettingsContext = React.createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings has been called outside a SettingsProvider.');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  console.log('settings', settings);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const reduxSettings = useSelector((state) => state.auth.settings);

  useEffect(() => {
    setSettings(reduxSettings);
    if (reduxSettings) {
      setIsSettingsLoaded(true);
    }
  }, [reduxSettings]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting: (path) => get(settings, path),
        settings,
        isSettingsLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
