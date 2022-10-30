import { Op } from 'sequelize';

export const deleteSyncSession = async (store, sessionId) => {
  // will cascade to sync session records
  await store.models.SyncSession.destroy({ where: { id: sessionId }, force: true });
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
