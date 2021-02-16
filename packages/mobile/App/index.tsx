import React, { ReactElement } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { BackendProvider } from '/contexts/BackendContext';

export const App = (): ReactElement => (
  <BackendProvider Component={RootStack} />
);
