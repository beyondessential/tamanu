import React, { ReactElement, useEffect } from 'react';
import { RootStack } from '/navigation/stacks/Root';
import './ui/reactotron';
import { SqliteHelper } from './infra/db/sqlite/helpers/sqlite-helper';

export const App = (): ReactElement => {
  useEffect(() => {
    SqliteHelper.connect();
  });
  return <RootStack />;
};
