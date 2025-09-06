export function dbRecordToResponse(patientRecord, facilityId) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
    markedForSync: !!patientRecord.markedForSyncFacilities?.find((f) => f.id === facilityId),
  };
}

export function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}
