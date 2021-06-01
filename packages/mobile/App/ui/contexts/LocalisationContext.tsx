import React, { createContext, useContext, useState, useEffect, PropsWithChildren, ReactElement } from 'react';
import { get } from 'lodash';

import { readConfig, writeConfig } from '~/services/config';

interface LocalisationContextData {
  getLocalisation: (path: string) => any;
  setLocalisation: (localisationToSet: object) => Promise<void>;
}

const TEST_LOCALISATION_OVERRIDES = {}; // add values to this to test localisation in development
const CONFIG_KEY = 'localisation';

const LocalisationContext = createContext<LocalisationContextData>({} as LocalisationContextData);

export const LocalisationProvider = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  const [localisation, setLocalisation] = useState({});
  useEffect(() => {
    (async () => {
      const strLocalisation = await readConfig(CONFIG_KEY);
      setLocalisation(JSON.parse(strLocalisation));
    })();
  });

  const mergedLocalisation = { ...localisation, ...TEST_LOCALISATION_OVERRIDES };
  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation: path => get(mergedLocalisation, path),
        setLocalisation: async (localisationToSet) => {
          // make sure we can stringif_y before setting localisation
          const jsonLocalisation = JSON.stringify(localisationToSet);
          setLocalisation(localisationToSet);
          await writeConfig(CONFIG_KEY, jsonLocalisation);
        }
      }}>
      {children}
    </LocalisationContext.Provider>
  );
};

export const useLocalisation = () => useContext(LocalisationContext);
