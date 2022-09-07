import { SYNC_SESSION_DIRECTION } from './constants';

export const findSessionSyncRecords = async (
  isCentralServer,
  models,
  recordType,
  limit,
  offset,
  sessionIndex,
) => {
  const where = {
    recordType,
    ...(isCentralServer ? { sessionIndex, direction: SYNC_SESSION_DIRECTION.INCOMING } : {}),
  };

  return models.SessionSyncRecord.findAll({
    where,
    order: [['id', 'ASC']],
    limit,
    offset,
  });
};
