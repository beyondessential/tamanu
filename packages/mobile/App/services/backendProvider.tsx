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

export const BackendProvider = ({ Component }) => {
  const backend = new Backend();

  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    (async () => {
      await backend.initialise();
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInitialised(true);
    })();
  }, []);

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
