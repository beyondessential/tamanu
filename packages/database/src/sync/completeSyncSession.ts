import type { Store } from '../types/sync';
import { dropSnapshotTable, dropMarkedForSyncPatientsTable } from './manageSnapshotTable';

/**
 * @returns whether this call ended the session; false if it had already ended, in which case
 * nothing is done
 */
export const completeSyncSession = async (store: Store, sessionId: string, error?: string) => {
  const { SyncSession } = store.models;
  // Sessions themselves stay as an artefact that forms a paper trail.
  // Happy-path snapshots are dropped immediately; errored snapshots are retained
  // for debugging and later reaped by SnapshotTableCleaner.
  const didEndSession = await SyncSession.markEnded(sessionId, error);
  if (!didEndSession || error) {
    return didEndSession;
  }
  await dropSnapshotTable(store.sequelize, sessionId);
  await dropMarkedForSyncPatientsTable(store.sequelize, sessionId);
  await SyncSession.update({ snapshotDroppedAt: new Date() }, { where: { id: sessionId } });
  return true;
};
