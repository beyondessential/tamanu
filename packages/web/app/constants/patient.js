import { TAMANU_COLORS } from '@tamanu/ui-components';

export const PATIENT_STATUS = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  EMERGENCY: 'Emergency',
  DECEASED: 'Deceased',
};

export const PATIENT_STATUS_COLORS = {
  [PATIENT_STATUS.INPATIENT]: TAMANU_COLORS.safe, // Green
  [PATIENT_STATUS.OUTPATIENT]: TAMANU_COLORS.secondary, // Yellow
  [PATIENT_STATUS.EMERGENCY]: TAMANU_COLORS.orange, // Orange
  [PATIENT_STATUS.DECEASED]: TAMANU_COLORS.midText, // grey
  [undefined]: TAMANU_COLORS.primary, // Blue
};

export const MAX_AGE_TO_RECORD_WEIGHT = 16;
