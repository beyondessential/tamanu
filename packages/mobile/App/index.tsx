import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { SqliteHelper } from './infra/db/sqlite/helpers/sqlite-helper';
import { BackendContext } from './services/backendContext';
import { Backend } from './services/backend';

export const App = (): ReactElement => {
  useEffect(() => {
    if (!SqliteHelper.client) {
      SqliteHelper.connect();
    }
  });
  return (
    <BackendContext.Provider value={new Backend()}>
      <RootStack />
    </BackendContext.Provider>
  );
};
