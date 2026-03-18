import config from 'config';

import { addHooks } from './hooks';
import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { loadSnapshotIfAvailable } from '@tamanu/database/services/migrations';
import { log } from '@tamanu/shared/services/logging';
import { setFhirRefreshTriggers } from './setFhirRefreshTriggers';

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  const store = await openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });

  // drop and recreate db
  if (testMode) {
    await store.sequelize.drop({ cascade: true });
    await loadSnapshotIfAvailable(log, store.sequelize);
    await store.sequelize.migrate('up');
  }
  if (key === 'main') {
    await addHooks(store);
  }

  if (!testMode) {
    await setFhirRefreshTriggers(store.sequelize);
  }

  return store;
};

export async function initDatabase({ testMode = false, dbKey = 'main' }) {
  // connect to database
  return await getOrCreateConnection(
    {
      testMode,
      saltRounds: config.auth.saltRounds,
    },
    dbKey,
  );
}

export async function closeDatabase() {
  return closeAllDatabases();
}
