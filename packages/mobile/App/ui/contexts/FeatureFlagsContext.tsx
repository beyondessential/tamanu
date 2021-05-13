import React, { createContext, useContext, useState, useEffect, PropsWithChildren, ReactElement } from 'react';
import { get } from 'lodash';

import { readConfig, writeConfig } from '~/services/config';

interface FeatureFlagsContextData {
  getFlag: (flagPath: string) => any;
  setFlags: (flags: object) => Promise<void>;
}

const OVERRIDES = {}; // add values to this to test feature flags in development
const CONFIG_KEY = 'featureFlags';

const FeatureFlagsContext = createContext<FeatureFlagsContextData>({} as FeatureFlagsContextData);

export const FeatureFlagsProvider = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  const [featureFlags, setFeatureFlags] = useState({});
  useEffect(() => {
    (async () => {
      const strFlags = await readConfig(CONFIG_KEY);
      setFeatureFlags(JSON.parse(strFlags));
    })();
  });

  const mergedFlags = { ...featureFlags, ...OVERRIDES };
  return (
    <FeatureFlagsContext.Provider
      value={{
        getFlag: flagPath => get(mergedFlags, flagPath),
        setFlags: async (flagsToSet) => {
          setFeatureFlags(flagsToSet);
          await writeConfig(CONFIG_KEY, JSON.stringify(flagsToSet));
        }
      }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFlags = () => useContext(FeatureFlagsContext);
