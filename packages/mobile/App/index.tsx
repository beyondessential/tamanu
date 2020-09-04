import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { BackendProvider } from './services/backendProvider';
import { Backend } from './services/backend';

export const App = (): ReactElement => (
  <BackendProvider Component={RootStack} />
);
