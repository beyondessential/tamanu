import { ENCOUNTER_TYPE_PATIENT_STATUSES, PATIENT_STATUSES } from '@tamanu/constants';
import { PATIENT_STATUS } from '../constants';

const STATUS_TO_LABEL = {
  [PATIENT_STATUSES.INPATIENT]: PATIENT_STATUS.INPATIENT,
  [PATIENT_STATUSES.OUTPATIENT]: PATIENT_STATUS.OUTPATIENT,
  [PATIENT_STATUSES.EMERGENCY]: PATIENT_STATUS.EMERGENCY,
};

export const getPatientStatus = encounterType => {
  if (!encounterType) {
    return '';
  }
  return STATUS_TO_LABEL[ENCOUNTER_TYPE_PATIENT_STATUSES[encounterType]];
};
