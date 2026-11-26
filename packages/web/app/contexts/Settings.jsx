import { get } from 'es-toolkit/compat';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SERVER_TYPES } from '@tamanu/constants';

import { SettingsContext, useSettings } from '@tamanu/ui-components';
import { checkIsFacilitySelected, checkIsLoggedIn, getServerType } from '../store/auth';
import { SettingsRefresher } from './SettingsRefresher';

export { useSettings };

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const reduxSettings = useSelector(state => state.auth.settings);
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);
  const serverType = useSelector(getServerType);
  // The admin panel, served by central, has no facility session.
  const isSessionReady =
    isUserLoggedIn && (isFacilitySelected || serverType === SERVER_TYPES.CENTRAL);

  useEffect(() => {
    setSettings(reduxSettings);
    setIsSettingsLoaded(Boolean(reduxSettings));
  }, [reduxSettings]);

  const getSetting = useCallback(path => get(settings, path), [settings]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting,
        settings,
        isSettingsLoaded,
      }}
    >
      {isSessionReady && <SettingsRefresher />}
      {children}
    </SettingsContext.Provider>
  );
};
