import config from 'config';

import { addHooks } from './hooks';
import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { resolveDbConfig } from '@tamanu/database/services/connectionConfig';

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
      // bcrypt cost for password + refresh-token hashing; config key is transitional
      saltRounds: +process.env.SALT_ROUNDS || config.auth.saltRounds,
    },
    dbKey,
  );
}

export async function closeDatabase() {
  return closeAllDatabases();
}
