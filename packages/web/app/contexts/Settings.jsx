import { get } from 'es-toolkit/compat';
import React, { useCallback, useEffect, useState } from 'react';
import { SERVER_TYPES } from '@tamanu/constants';

import { SettingsContext, useSettings } from '@tamanu/ui-components';
import { useAuth } from './Auth';
import { SettingsRefresher } from './SettingsRefresher';

export { useSettings };

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const { settings: authSettings, currentUser, facilityId, serverType } = useAuth();
  const isUserLoggedIn = Boolean(currentUser);
  const isFacilitySelected = Boolean(facilityId);
  // The admin panel, served by central, has no facility session.
  const isSessionReady =
    isUserLoggedIn && (isFacilitySelected || serverType === SERVER_TYPES.CENTRAL);

  useEffect(() => {
    setSettings(authSettings);
    setIsSettingsLoaded(Boolean(authSettings));
  }, [authSettings]);

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
