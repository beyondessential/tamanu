import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { SqliteHelper } from './infra/db/sqlite/helpers/sqlite-helper';

export const App = (): ReactElement => {
  useEffect(() => {
    if (!SqliteHelper.client) {
      SqliteHelper.connect();
    }
  });
  return <RootStack />;
};
