import { SYNC_SESSION_DIRECTION } from './constants';

export const findSyncSessionRecords = async (models, recordType, limit, offset, sessionId) => {
  const where = {
    recordType,
    sessionId,
    direction: SYNC_SESSION_DIRECTION.INCOMING,
  };

  return models.SyncSessionRecord.findAll({
    where,
    order: [['id', 'ASC']],
    limit,
    offset,
  });
};
