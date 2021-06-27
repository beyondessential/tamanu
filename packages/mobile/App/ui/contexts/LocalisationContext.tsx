import React, { createContext, useContext, useState, useEffect, useMemo, PropsWithChildren, ReactElement } from 'react';

import { BackendContext } from '~/ui/contexts/BackendContext';
import { LocalisationService } from '~/services/localisation';

interface LocalisationContextData {
  getLocalisation: (path: string) => any;
  getString: (path: string, defaultValue?: string) => string;
  getBool: (path: string, defaultValue?: boolean) => boolean;
}

const LocalisationContext = createContext<LocalisationContextData>({} as LocalisationContextData);

const makeHelpers = (localisation: LocalisationService): LocalisationContextData => ({
  getLocalisation: path => localisation.getLocalisation(path),
  getString: (path, defaultString) => localisation.getString(path, defaultString),
  getBool: (path, defaultBool) => localisation.getBool(path, defaultBool),
});

export const LocalisationProvider = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  const backend = useContext(BackendContext);

  const defaultHelpers = useMemo(() => makeHelpers(backend.localisation), [backend, backend.localisation])
  const [helpers, setHelpers] = useState(defaultHelpers);

  useEffect(() => {
    const onChanged = () => {
      // updates the helper functions whenever the localisation changes,
      // in order to make components update with the new value
      setHelpers(makeHelpers(backend.localisation));
    };
    backend.localisation.emitter.on('changed', onChanged);
    return () => {
      backend.localisation.emitter.off('changed', onChanged);
    };
  }, [backend, backend.localisation]);

  return (
    <LocalisationContext.Provider value={helpers}>
      {children}
    </LocalisationContext.Provider>
  );
};

export const useLocalisation = () => useContext(LocalisationContext);
