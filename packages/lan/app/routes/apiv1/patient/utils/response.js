export function dbRecordToResponse(patientRecord) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
  };
}

export function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}
