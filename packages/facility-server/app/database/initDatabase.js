import config from 'config';

import { closeAllDatabases, openDatabase } from '@tamanu/database/services/database';
import { setFhirRefreshTriggers } from '@tamanu/database';
import { fakeUUID } from '@tamanu/utils/generateId';

const getOrCreateConnection = async (configOverrides, key = 'main') => {
  const testMode = process.env.NODE_ENV === 'test';
  const store = await openDatabase(key, {
    ...config.db,
    ...configOverrides,
    testMode,
  });

  if (!testMode) {
    const triggersEnabled =
      !!config?.integrations?.fhir?.enabled && !!config?.integrations?.fhir?.worker?.enabled;
    await setFhirRefreshTriggers(store.sequelize, { triggersEnabled });
  }

  return store;
};

export async function initDatabase(configOverrides = {}, key = 'main') {
  const testMode = process.env.NODE_ENV === 'test';
  return getOrCreateConnection(
    {
      ...configOverrides,
      primaryKeyDefault: testMode ? fakeUUID : undefined,
    },
    key,
  );
}

export async function closeDatabase() {
  return closeAllDatabases();
}
