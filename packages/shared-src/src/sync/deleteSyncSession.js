import { Op } from 'sequelize';

export const deleteSyncSession = async (store, sessionId) => {
  // Explicitly delete all the sync_session_records and sync_sessions because
  // they are not synced, and we should free up the storage because the number of records
  // can be very large
  const { SyncSessionRecord, SyncSession } = store.models;
  await SyncSessionRecord.destroy({ where: { sessionId }, force: true });
  await SyncSession.destroy({ where: { id: sessionId }, force: true });
};

export const deleteInactiveSyncSessions = async (store, lapsedSessionSeconds) => {
  const { SyncSession } = store.models;
  const lapsedSessions = await SyncSession.findAll({
    where: { lastConnectionTime: { [Op.lt]: Date.now() - lapsedSessionSeconds * 1000 } },
    select: ['id'],
    raw: true,
  });
  for (const { id: sessionId } of lapsedSessions) {
    await deleteSyncSession(store, sessionId);
  }
};
