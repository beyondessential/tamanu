import { SESSION_SYNC_DIRECTION } from './constants';

export const findSessionSyncRecordsForFacility = async (models, recordType, limit, offset) =>
  models.SessionSyncRecord.findAll({
    where: { recordType },
    order: [['id', 'ASC']],
    limit,
    offset,
  });

export const findSessionSyncRecordsForCentral = async (
  models,
  recordType,
  sessionIndex,
  limit,
  offset,
) =>
  models.SessionSyncRecord.findAll({
    where: { recordType, sessionIndex, direction: SESSION_SYNC_DIRECTION.INCOMING },
    order: [['id', 'ASC']],
    limit,
    offset,
  });
