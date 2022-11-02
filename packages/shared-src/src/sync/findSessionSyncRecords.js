import { SYNC_SESSION_DIRECTION } from './constants';

export const findSessionSyncRecords = async (models, recordType, limit, offset, sessionId) => {
  const where = {
    recordType,
    sessionId,
    direction: SYNC_SESSION_DIRECTION.INCOMING,
  };

  return models.SessionSyncRecord.findAll({
    where,
    order: [['id', 'ASC']],
    limit,
    offset,
  });
};
