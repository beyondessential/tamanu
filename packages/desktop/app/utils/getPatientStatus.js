import { ENCOUNTER_TYPES } from 'shared/constants';
import { PATIENT_STATUS } from '../constants';
import { capitaliseFirstLetter } from './capitalise';

const ENCOUNTER_TYPE_TO_STATUS = {
  [ENCOUNTER_TYPES.ADMISSION]: PATIENT_STATUS.INPATIENT,
  [ENCOUNTER_TYPES.CLINIC]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.IMAGING]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.OBSERVATION]: PATIENT_STATUS.EMERGENCY,
  [ENCOUNTER_TYPES.EMERGENCY]: PATIENT_STATUS.EMERGENCY,
  [ENCOUNTER_TYPES.TRIAGE]: PATIENT_STATUS.EMERGENCY,
};

export const getPatientStatus = encounterType => {
  if (encounterType) {
    return '';
  }
  return capitaliseFirstLetter(ENCOUNTER_TYPE_TO_STATUS[encounterType]);
};
