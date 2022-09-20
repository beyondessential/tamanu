import { SYNC_SESSION_DIRECTION } from './constants';

export const countSessionSyncRecords = async (
  isCentralServer,
  models,
  recordType,
  sessionId,
) => {
  const where = {
    recordType,
    ...(isCentralServer ? { sessionId, direction: SYNC_SESSION_DIRECTION.INCOMING } : {}),
  };

  return models.SessionSyncRecord.count({
    where,
  });
};
