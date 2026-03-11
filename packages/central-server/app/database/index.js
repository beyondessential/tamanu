import config from 'config';

import { addHooks } from './hooks';
import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { patchReadSettings } from '@tamanu/shared/utils/patchReadSettings';
import { log } from '@tamanu/shared/services/logging';
import { REPORT_DB_SCHEMAS } from '@tamanu/constants';
import { setFhirRefreshTriggers } from './setFhirRefreshTriggers';

// Patch ReadSettings to add getSecret method
patchReadSettings();

const getOrCreateConnection = async ({ testMode, ...configOverrides }, key = 'main') => {
  const store = await openDatabase(key, {
    ...config.db,
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

  await setFhirRefreshTriggers(store.sequelize);

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
