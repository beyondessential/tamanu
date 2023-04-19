import { dropSnapshotTable } from './manageSnapshotTable';

export const completeSyncSession = async (store, sessionId, error) => {
  // just drop the snapshots, leaving sessions themselves as an artefact that forms a paper trail
  await store.models.SyncSession.update({ completedAt: new Date() }, { where: { id: sessionId } });
  await dropSnapshotTable(store.sequelize, sessionId);
  if (error) {
    await store.models.SyncSession.update({ error }, { where: { id: sessionId } });
  }
};
