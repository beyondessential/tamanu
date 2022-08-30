export function dbRecordToResponse(patientRecord) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
    markedForSync: !!patientRecord.patientFacilities?.length > 0,
  };
}

export function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}
