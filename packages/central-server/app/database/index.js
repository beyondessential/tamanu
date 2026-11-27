import config from 'config';

import { addHooks } from './hooks';
import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { resolveDbConfig } from '@tamanu/database/services/connectionConfig';

const DEFAULT_SALT_ROUNDS = 12;

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  const store = await openDatabase(key, {
    ...resolveDbConfig(config.db),
    ...configOverrides,
    testMode,
  });

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop({ cascade: true });
    await store.sequelize.migrate('up');
  }
  if (key === 'main') {
    await addHooks(store);
  }

  return store;
};

export async function initDatabase({ testMode = false, dbKey = 'main' }) {
  // connect to database
  return await getOrCreateConnection(
    {
      testMode,
      saltRounds: +process.env.SALT_ROUNDS || DEFAULT_SALT_ROUNDS,
    },
    dbKey,
  );
}

export async function closeDatabase() {
  return closeAllDatabases();
}
