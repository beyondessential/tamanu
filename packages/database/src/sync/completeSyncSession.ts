import type { Store } from '../types/sync';
import { dropSnapshotTable, dropMarkedForSyncPatientsTable } from './manageSnapshotTable';

export const completeSyncSession = async (store: Store, sessionId: string, error: string) => {
  // just drop the snapshots, leaving sessions themselves as an artefact that forms a paper trail
  const session = await store.models.SyncSession?.findByPk(sessionId);
  session!.completedAt = new Date();
  if (error) {
    await session?.markErrored(error);
  }
  await session?.save();
  await dropSnapshotTable(store.sequelize, sessionId);
  await dropMarkedForSyncPatientsTable(store.sequelize, sessionId);
};
