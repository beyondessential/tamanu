import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { BackendContext } from './services/backendContext';
import { Backend } from './services/backend';

export const App = (): ReactElement => (
  <BackendContext.Provider value={new Backend()}>
    <RootStack />
  </BackendContext.Provider>
);
