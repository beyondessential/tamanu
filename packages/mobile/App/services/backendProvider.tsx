import React, { useState, useEffect } from 'react';
import { Backend } from './backend';

import { LoadingScreen } from '~/ui/components/LoadingScreen';

export const BackendContext = React.createContext(undefined);

const backend = new Backend();

export const BackendProvider = ({ Component }): JSX.Element => {
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async (): Promise<void> => {
      await backend.initialise();
      setInitialised(true);
    })();
  }, [backend.randomId]);

  if (!initialised) {
    return <LoadingScreen text="Connecting to database..." />;
  }

  return (
    <BackendContext.Provider value={backend}>
      <Component />
    </BackendContext.Provider>
  );
};
