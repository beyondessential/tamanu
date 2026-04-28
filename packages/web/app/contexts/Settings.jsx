import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';
import { SettingsContext, useSettings } from '@tamanu/ui-components';

import { SettingsRefresher } from './SettingsRefresher';
import { checkIsFacilitySelected } from '../store/auth';

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

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(settings, path),
        settings,
        isSettingsLoaded,
      }}
    >
      {/* Only mount once a facility is selected: settings are facility-scoped, and
          mounting earlier risks the refresh endpoint returning no settings (no
          facility context) and overwriting any global settings already in redux. */}
      {isFacilitySelected && <SettingsRefresher />}
      {children}
    </SettingsContext.Provider>
  );
};
