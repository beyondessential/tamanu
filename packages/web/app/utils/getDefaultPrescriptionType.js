import {
  PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES,
  PHARMACY_PRESCRIPTION_TYPES,
} from '@tamanu/constants';

import { PATIENT_STATUS } from '../constants';
import { getPatientStatus } from './getPatientStatus';

/**
 * Turns the facility's `medications.pharmacyOrder.defaultPrescriptionType` *setting* into the
 * prescription type a pharmacy order should start on. Two of the modes name a type outright; the
 * third defers to the encounter the patient is in.
 */
export const getDefaultPrescriptionType = (defaultPrescriptionTypeMode, encounterType) => {
  const { INPATIENT, OUTPATIENT_OR_DISCHARGE } = PHARMACY_ORDER_DEFAULT_PRESCRIPTION_MODES;

  if (defaultPrescriptionTypeMode === INPATIENT) {
    return PHARMACY_PRESCRIPTION_TYPES.INPATIENT;
  }
  if (defaultPrescriptionTypeMode === OUTPATIENT_OR_DISCHARGE) {
    return PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT;
  }
  // Remaining mode is ENCOUNTER_TYPE: emergency and triage count as inpatient, not outpatient.
  return getPatientStatus(encounterType) === PATIENT_STATUS.OUTPATIENT
    ? PHARMACY_PRESCRIPTION_TYPES.DISCHARGE_OR_OUTPATIENT
    : PHARMACY_PRESCRIPTION_TYPES.INPATIENT;
};
