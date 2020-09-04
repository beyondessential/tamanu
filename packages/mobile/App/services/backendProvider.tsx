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
      await backend.initialise();
      setInitialised(true);
    })();
  }, [backend.randomId]);

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
