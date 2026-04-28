import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';
import { SettingsContext, useSettings } from '@tamanu/ui-components';

import { SettingsRefresher } from './SettingsRefresher';
import { checkIsLoggedIn } from '../store/auth';

export { useSettings };

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const reduxSettings = useSelector(state => state.auth.settings);
  const isLoggedIn = useSelector(checkIsLoggedIn);

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
      {/* Only mount once logged in so we don't open an extra socket on the login screen. */}
      {isLoggedIn && <SettingsRefresher />}
      {children}
    </SettingsContext.Provider>
  );
};
