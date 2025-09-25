import { Colors } from './styles';

export const PATIENT_STATUS = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  EMERGENCY: 'Emergency',
  DECEASED: 'Deceased',
};

export const PATIENT_STATUS_COLORS = {
  [PATIENT_STATUS.INPATIENT]: Colors.safe, // Green
  [PATIENT_STATUS.OUTPATIENT]: Colors.secondary, // Yellow
  [PATIENT_STATUS.EMERGENCY]: Colors.orange, // Orange
  [PATIENT_STATUS.DECEASED]: Colors.midText, // grey
  [undefined]: Colors.primary, // Blue
};

export const MAX_AGE_TO_RECORD_WEIGHT = 16;
