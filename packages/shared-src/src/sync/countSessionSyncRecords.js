import { SYNC_SESSION_DIRECTION } from './constants';

export const countSessionSyncRecords = async (models, recordType, sessionId) => {
  const where = {
    recordType,
    sessionId,
    direction: SYNC_SESSION_DIRECTION.INCOMING,
  };

  return models.SessionSyncRecord.count({
    where,
  });
};
