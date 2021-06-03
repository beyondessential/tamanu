import React, { createContext, useContext, useState, useEffect, PropsWithChildren, ReactElement } from 'react';
import { get } from 'lodash';

import { readConfig, writeConfig } from '~/services/config';

interface LocalisationContextData {
  getLocalisation: (path: string) => any;
  getString: (path: string, defaultValue?: string) => string;
  getBool: (path: string, defaultValue?: boolean) => boolean;
  setLocalisation: (localisationToSet: object) => Promise<void>;
}

const TEST_LOCALISATION_OVERRIDES = {}; // add values to this to test localisation in development
const CONFIG_KEY = 'localisation';

const LocalisationContext = createContext<LocalisationContextData>({} as LocalisationContextData);

export const LocalisationProvider = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  const [localisation, setLocalisationInner] = useState({});

  useEffect(() => {
    (async () => {
      const strLocalisation = await readConfig(CONFIG_KEY);
      setLocalisationInner(JSON.parse(strLocalisation));
    })();
  });

  const mergedLocalisation = { ...localisation, ...TEST_LOCALISATION_OVERRIDES };

  // helpers
  const getLocalisation = (path: string) => get(mergedLocalisation, path);

  const getString = (path: string, defaultValue?: string): string => {
    const value = getLocalisation(path);
    if (typeof value === 'string') {
      return value;
    }
    if (typeof defaultValue === 'string') {
      return defaultValue;
    }
    return path;
  };

  const getBool = (path: string, defaultValue?: boolean): boolean => {
    const value = getLocalisation(path);
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof defaultValue === 'boolean') {
      return value;
    }
    return false;
  };

  const setLocalisation = async (localisationToSet: object) => {
    // make sure we can stringify before setting localisation
    const jsonLocalisation = JSON.stringify(localisationToSet);
    setLocalisationInner(localisationToSet);
    await writeConfig(CONFIG_KEY, jsonLocalisation);
  };

  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation,
        getString,
        getBool,
        setLocalisation,
      }}>
      {children}
    </LocalisationContext.Provider>
  );
};

export const useLocalisation = () => useContext(LocalisationContext);
