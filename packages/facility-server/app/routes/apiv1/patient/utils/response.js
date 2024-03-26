import config from 'config';

export function dbRecordToResponse(patientRecord) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
    markedForSync: !!patientRecord.markedForSyncFacilities?.find(
      f => f.id === config.serverFacilityId,
    ),
  };
}

export function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}
