import { PATIENT_STATUS } from '../constants';
import { getPatientStatus } from './getPatientStatus';

export const isInpatient = (encounterType) => {
  return getPatientStatus(encounterType) === PATIENT_STATUS.INPATIENT;
};
