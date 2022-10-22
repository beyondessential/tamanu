import { Op } from 'sequelize';
import { SYNC_SESSION_DIRECTION } from './constants';

export const findSyncSessionRecords = async (models, recordType, limit, fromId, sessionId) => {
  const where = {
    id: { [Op.gt]: fromId },
    recordType,
    sessionId,
    direction: SYNC_SESSION_DIRECTION.INCOMING,
  };

  return models.SyncSessionRecord.findAll({
    where,
    order: [['id', 'ASC']],
    limit,
  });
};
