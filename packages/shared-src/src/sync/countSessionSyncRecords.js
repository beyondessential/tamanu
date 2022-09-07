import { SYNC_SESSION_DIRECTION } from './constants';

export const countSessionSyncRecords = async (
  isCentralServer,
  models,
  recordType,
  sessionIndex,
) => {
  const where = {
    recordType,
    ...(isCentralServer ? { sessionIndex, direction: SYNC_SESSION_DIRECTION.INCOMING } : {}),
  };

  return models.SessionSyncRecord.count({
    where,
  });
};
