import config from 'config';

import { fakeUUID } from '@tamanu/shared/utils/generateId';
import { initDatabase as sharedInitDatabase } from '@tamanu/shared/services/database';

let existingConnection = null;

export async function initDatabase() {
  if (existingConnection) {
    return existingConnection;
  }

  const testMode = process.env.NODE_ENV === 'test';
  existingConnection = await sharedInitDatabase({
    ...config.db,
    testMode,
    primaryKeyDefault: testMode ? fakeUUID : undefined,
    enableReportInstances: true,
  });
  return existingConnection;
}

export async function closeDatabase() {
  if (existingConnection) {
    const oldConnection = existingConnection;
    existingConnection = null;
    await oldConnection.sequelize.close();
  }
}
