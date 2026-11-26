import React, { useContext, useEffect, useState } from 'react';
import { get, merge } from 'es-toolkit/compat';

import { useAuth } from './Auth';

const overrides = {}; // add keys to this object to help with development

const LocalisationContext = React.createContext({
  getLocalisation: () => {},
});

export const useLocalisation = () => useContext(LocalisationContext);

export const LocalisationProvider = ({ children }) => {
  const [localisation, setLocalisation] = useState({});
  const { localisation: authLocalisation } = useAuth();
  useEffect(() => {
    setLocalisation(merge(authLocalisation, overrides));
  }, [authLocalisation]);

  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation: (path) => get(localisation, path),
        localisation,
      }}
    >
      {children}
    </LocalisationContext.Provider>
  );
};
