import { get } from 'lodash-es';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { SettingsContext, useSettings } from '@tamanu/ui-components';
import { checkIsFacilitySelected } from '../store/auth';
import { SettingsRefresher } from './SettingsRefresher';

export { useSettings };

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const reduxSettings = useSelector(state => state.auth.settings);
  const isFacilitySelected = useSelector(checkIsFacilitySelected);

  useEffect(() => {
    setSettings(reduxSettings);
    if (reduxSettings) {
      setIsSettingsLoaded(true);
    }
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
      {/* Web settings are tied to the selected facility session. */}
      {isFacilitySelected && <SettingsRefresher />}
      {children}
    </SettingsContext.Provider>
  );
};
