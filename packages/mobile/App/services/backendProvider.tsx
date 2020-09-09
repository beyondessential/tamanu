import React, { useState, useEffect } from 'react';
import { Backend } from './backend';

import {
  StyledSafeAreaView,
  StyledText,
  StyledView,
  CenterView,
} from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';

export const BackendContext = React.createContext();

const backend = new Backend();

export const BackendProvider = ({ Component }) => {

  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async () => {
      backend.stopSyncService();
      setInitialised(false);
      await backend.initialise(Date.now());
      setInitialised(true);
    })();
    return () => backend.stopSyncService();
  }, [backend]);

  if(!initialised) {
    return (
      <LoadingScreen text="Connecting to database..." />
    );
  }

  return (
    <BackendContext.Provider value={backend}>
      <Component />
    </BackendContext.Provider>
  );
};
