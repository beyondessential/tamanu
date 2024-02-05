import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useBackend } from '../hooks/index';
import { SettingService } from '~/services/settings';

export type GetSettings = <T>(path: string, defaultValue?: T) => T;

interface SettingContextData {
  getSetting: GetSettings;
}

const SettingContext = createContext<SettingContextData>({} as SettingContextData);

const makeHelpers = (settings: SettingService): SettingContextData => ({
  getSetting: (path, defaultValue) => settings.getSetting(path) || defaultValue,
});

export const SettingProvider = ({ children }: PropsWithChildren<object>) => {
  const backend = useBackend();

  const defaultHelpers = useMemo(() => makeHelpers(backend.settings), [backend, backend.settings]);
  const [helpers, setHelpers] = useState(defaultHelpers);

  useEffect(() => {
    const onChanged = (): void => {
      // updates the helper functions whenever a setting changes,
      // in order to make components update with the new value
      setHelpers(makeHelpers(backend.settings));
    };
    backend.settings.emitter.on('settingChanged', onChanged);
    return () => {
      backend.settings.emitter.off('settingChanged', onChanged);
    };
  }, [backend, backend.settings]);

  return <SettingContext.Provider value={helpers}>{children}</SettingContext.Provider>;
};

export const useSettings = (): SettingContextData => useContext(SettingContext);
