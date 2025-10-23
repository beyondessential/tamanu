import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';
import { SettingsContext, useSettings } from '@tamanu/ui-components';

export { useSettings };

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const reduxSettings = useSelector(state => state.auth.settings);

  useEffect(() => {
    setSettings(reduxSettings);
    if (reduxSettings) {
      setIsSettingsLoaded(true);
    }
  }, [reduxSettings]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(settings, path),
        settings,
        isSettingsLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
