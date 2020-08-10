import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { SqliteHelper } from './infra/db/sqlite/helpers/sqlite-helper';
import { APIContext } from './services/apiContext';
import { API } from './services/api';

export const App = (): ReactElement => {
  useEffect(() => {
    if (!SqliteHelper.client) {
      SqliteHelper.connect();
    }
  });
  return (
    <APIContext.Provider value={new API()}>
      <RootStack />
    </APIContext.Provider>
  );
};
