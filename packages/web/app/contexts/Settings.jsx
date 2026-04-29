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
      {/* Web settings are tied to the selected facility session. */}
      {isFacilitySelected && <SettingsRefresher />}
      {children}
    </SettingsContext.Provider>
  );
};
