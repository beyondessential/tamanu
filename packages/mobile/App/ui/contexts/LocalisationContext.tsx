import React, { createContext, useContext, useMemo, PropsWithChildren, ReactElement } from 'react';

import { BackendContext } from '~/ui/contexts/BackendContext';

interface LocalisationContextData {
  getLocalisation: (path: string) => any;
  getString: (path: string, defaultValue?: string) => string;
  getBool: (path: string, defaultValue?: boolean) => boolean;
}

const LocalisationContext = createContext<LocalisationContextData>({} as LocalisationContextData);

export const LocalisationProvider = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  const backend = useContext(BackendContext);

  const helpers: LocalisationContextData = useMemo(() => ({
    getLocalisation: path => backend.localisation.getLocalisation(path),
    getString: (path, defaultString) => backend.localisation.getString(path, defaultString),
    getBool: (path, defaultBool) => backend.localisation.getBool(path, defaultBool),
  }), [backend, backend.localisation, backend.localisation.localisations]);

  return (
    <LocalisationContext.Provider value={helpers}>
      {children}
    </LocalisationContext.Provider>
  );
};

export const useLocalisation = () => useContext(LocalisationContext);
