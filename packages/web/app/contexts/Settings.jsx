import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

/**
 * @typedef {import("@tamanu/settings/types").FrontEndExposedSettingPath} SettingPath
 * @typedef {Object} SettingsContextType
 * @property {(path: SettingPath) => ?} getSetting
 */

/** @type {React.Context<SettingsContextType | undefined>} */
const SettingsContext = React.createContext();

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
        getSetting: path => get(settings, path),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
