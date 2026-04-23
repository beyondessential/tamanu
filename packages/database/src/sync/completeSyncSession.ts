import type { Store } from '../types/sync';
import { dropSnapshotTable, dropMarkedForSyncPatientsTable } from './manageSnapshotTable';

export const completeSyncSession = async (store: Store, sessionId: string, error: string) => {
  // Sessions themselves stay as an artefact that forms a paper trail.
  // Happy-path snapshots are dropped immediately; errored snapshots are retained
  // for debugging and later reaped by SnapshotTableCleaner.
  const session = await store.models.SyncSession?.findByPk(sessionId);
  if (error) {
    await session?.markErrored(error);
    return;
  }
  session!.completedAt = new Date();
  await session?.save();
  await dropSnapshotTable(store.sequelize, sessionId);
  await dropMarkedForSyncPatientsTable(store.sequelize, sessionId);
};
