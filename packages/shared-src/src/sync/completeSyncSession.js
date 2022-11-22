import { Op } from 'sequelize';

export const completeSyncSession = async (store, sessionId) => {
  // just delete sync session records, leaving sessions themselves as an artefact that forms a
  // paper trail
  await store.models.SyncSession.update({ completedAt: new Date() }, { where: { id: sessionId } });
  await store.models.SyncSessionRecord.destroy({ where: { sessionId }, force: true });
};

export const completeInactiveSyncSessions = async (store, lapsedSessionSeconds) => {
  const { SyncSession } = store.models;
  const lapsedSessions = await SyncSession.findAll({
    where: {
      lastConnectionTime: { [Op.lt]: Date.now() - lapsedSessionSeconds * 1000 },
      completedAt: { [Op.is]: null },
    },
    select: ['id'],
    raw: true,
  });
  for (const { id: sessionId } of lapsedSessions) {
    await completeSyncSession(store, sessionId);
  }
};
