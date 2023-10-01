import config from 'config';

import { fakeUUID } from '@tamanu/shared/utils/generateId';
import {
  initDatabase as sharedInitDatabase,
  initReportingInstances,
} from '@tamanu/shared/services/database';

let existingConnection = null;
let existingReportConnections = null;

export async function initDatabase() {
  if (existingConnection) {
    return existingConnection;
  }

  const testMode = process.env.NODE_ENV === 'test';
  existingConnection = await sharedInitDatabase({
    ...config.db,
    testMode,
    primaryKeyDefault: testMode ? fakeUUID : undefined,
  });
  return existingConnection;
}

export async function closeDatabase() {
  if (existingReportConnections) {
    const oldConnections = existingReportConnections;
    existingReportConnections = null;
    await Promise.all(Object.values(oldConnections).map(c => c.sequelize.close()));
  }
  if (existingConnection) {
    const oldConnection = existingConnection;
    existingConnection = null;
    await oldConnection.sequelize.close();
  }
}

export async function initReporting() {
  if (existingReportConnections) {
    return existingReportConnections;
  }
  const testMode = process.env.NODE_ENV === 'test';
  existingReportConnections = await initReportingInstances({
    ...config.db,
    testMode,
  });
  console.log(existingReportConnections);
  return existingReportConnections;
}
