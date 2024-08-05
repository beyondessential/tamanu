import { dropSnapshotTable, dropMarkedForSyncPatientsTable } from './manageSnapshotTable';

export const completeSyncSession = async (store, sessionId, error) => {
  // just drop the snapshots, leaving sessions themselves as an artefact that forms a paper trail
  const session = await store.models.SyncSession.findByPk(sessionId);
  session.completedAt = new Date();
  if (error && !session.error) {
    session.error = error;
  }
  await session.save();
  await dropSnapshotTable(store.sequelize, sessionId);
  await dropMarkedForSyncPatientsTable(store.sequelize, sessionId);
};
