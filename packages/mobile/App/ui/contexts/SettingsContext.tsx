import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SettingsService } from '~/services/settings';
import { BackendContext } from './BackendContext';

interface SettingsContextData {
  getSetting<T>(key: string): T | undefined;
}

const makeHelpers = (settings: SettingsService): SettingsContextData => ({
  getSetting: path => settings.getSetting(path),
});

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const backend = useContext(BackendContext);
  const [helpers, setHelpers] = useState(() => makeHelpers(backend.settings));

  useEffect(() => {
    const onChanged = () => void setHelpers(makeHelpers(backend.settings));
    backend.settings.emitter.on('settingsChanged', onChanged);
    return () => void backend.settings.emitter.off('settingsChanged', onChanged);
  }, [backend]);

  return <SettingsContext.Provider value={helpers}>{children}</SettingsContext.Provider>;
};
