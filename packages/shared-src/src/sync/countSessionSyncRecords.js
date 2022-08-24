import { SESSION_SYNC_DIRECTION } from './constants';

export const countSessionSyncRecordsForFacility = async (models, recordType) =>
  models.SessionSyncRecord.count({
    where: { recordType },
  });

export const countSessionSyncRecordsForCentral = async (models, recordType, sessionIndex) =>
  models.SessionSyncRecord.count({
    where: { recordType, sessionIndex, direction: SESSION_SYNC_DIRECTION.INCOMING },
  });
