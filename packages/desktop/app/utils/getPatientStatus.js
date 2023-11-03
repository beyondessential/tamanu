import React from 'react';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { PATIENT_STATUS } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

const ENCOUNTER_TYPE_TO_STATUS = {
  [ENCOUNTER_TYPES.ADMISSION]: PATIENT_STATUS.INPATIENT,
  [ENCOUNTER_TYPES.CLINIC]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.IMAGING]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.OBSERVATION]: PATIENT_STATUS.EMERGENCY,
  [ENCOUNTER_TYPES.EMERGENCY]: PATIENT_STATUS.EMERGENCY,
  [ENCOUNTER_TYPES.TRIAGE]: PATIENT_STATUS.EMERGENCY,
};

const STATUS_TO_TRANSLATION = {
  [PATIENT_STATUS.INPATIENT]: (
    <TranslatedText stringId="patient.table.status.inpatient" fallback="Inpatient" />
  ),
  [PATIENT_STATUS.OUTPATIENT]: (
    <TranslatedText stringId="patient.table.status.outpatient" fallback="Outpatient" />
  ),
  [PATIENT_STATUS.EMERGENCY]: (
    <TranslatedText stringId="patient.table.status.emergency" fallback="Emergency" />
  ),
};

export const getPatientStatus = encounterType => {
  if (!encounterType) {
    return '';
  }
  return STATUS_TO_TRANSLATION[ENCOUNTER_TYPE_TO_STATUS[encounterType]];
};
