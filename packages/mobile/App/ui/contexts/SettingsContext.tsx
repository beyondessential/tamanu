import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackendContext } from './BackendContext';
import { SettingsService } from '~/services/settings';

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultHelpers = useMemo(() => makeHelpers(backend.settings), [backend, backend.settings]);
  const [helpers, setHelpers] = useState(defaultHelpers);

  useEffect(() => {
    const onChanged = (): void => {
      // updates the helper functions whenever the localisation changes,
      // in order to make components update with the new value
      setHelpers(makeHelpers(backend.settings));
    };
    backend.localisation.emitter.on('settingsChanged', onChanged);
    return () => {
      backend.localisation.emitter.off('settingsChanged', onChanged);
    };
  }, [backend, backend.localisation]);

  return <SettingsContext.Provider value={helpers}>{children}</SettingsContext.Provider>;
};
