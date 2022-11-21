import { Op } from 'sequelize';

export const getOutgoingChangesForSession = async (
  store,
  sessionId,
  direction,
  fromId = '00000000-0000-0000-0000-000000000000',
  limit,
) => {
  const results = await store.models.SyncSessionRecord.findAll({
    where: {
      sessionId,
      direction,
      id: { [Op.gt]: fromId },
    },
    order: [['id', 'ASC']],
    limit,
    raw: true,
  });

  return results;
};
