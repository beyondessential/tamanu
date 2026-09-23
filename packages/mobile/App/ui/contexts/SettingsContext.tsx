import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackendContext } from './BackendContext';
import type { SettingsService } from '~/services/settings';

interface SettingsContextData {
  getSetting<T>(key: string): T | undefined;
}

const makeHelpers = (settings: SettingsService): SettingsContextData => ({
  getSetting: path => settings.getSetting(path),
});

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const backend = useContext(BackendContext);

  const defaultHelpers = useMemo(() => makeHelpers(backend.settings), [backend.settings]);
  const [helpers, setHelpers] = useState(defaultHelpers);

  useEffect(() => {
    const onChanged = (): void => {
      // updates the helper functions whenever the settings change,
      // in order to make components update with the new value
      setHelpers(makeHelpers(backend.settings));
    };
    backend.settings.emitter.on('settingsChanged', onChanged);
    return () => {
      backend.settings.emitter.off('settingsChanged', onChanged);
    };
  }, [backend, backend.settings]);

  return <SettingsContext.Provider value={helpers}>{children}</SettingsContext.Provider>;
};
