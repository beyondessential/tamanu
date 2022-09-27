import config from 'config';

export function dbRecordToResponse(patientRecord) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
    markedForSync: !!patientRecord.patientFacilities?.find(
      patientFacility => patientFacility.facilityId === config.serverFacilityId,
    ),
  };
}

export function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}
