import React, { useState, useEffect } from 'react';
import { Backend } from './backend';

import { LoadingScreen } from '~/ui/components/LoadingScreen';

export const BackendContext = React.createContext({ models: [] });

const backend = new Backend();

export const BackendProvider = ({ Component }): Element => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      await backend.initialise();
      setInitialised(true);
    })();
  }, [backend.randomId]);

  if (!initialised) {
    return <LoadingScreen />;
  }

  return (
    <BackendContext.Provider value={backend}>
      <Component />
    </BackendContext.Provider>
  );
};
