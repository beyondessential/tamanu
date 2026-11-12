import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { getPatientStatus } from '../../app/utils/getPatientStatus';
import { PATIENT_STATUS } from '../../app/constants';

describe('getPatientStatus', () => {
  it.each([
    [ENCOUNTER_TYPES.ADMISSION, PATIENT_STATUS.INPATIENT],
    [ENCOUNTER_TYPES.CLINIC, PATIENT_STATUS.OUTPATIENT],
    [ENCOUNTER_TYPES.IMAGING, PATIENT_STATUS.OUTPATIENT],
    [ENCOUNTER_TYPES.TRIAGE, PATIENT_STATUS.EMERGENCY],
    [ENCOUNTER_TYPES.OBSERVATION, PATIENT_STATUS.EMERGENCY],
    [ENCOUNTER_TYPES.EMERGENCY, PATIENT_STATUS.EMERGENCY],
  ])('gives a %s encounter the %s status', (encounterType, patientStatus) => {
    expect(getPatientStatus(encounterType)).toBe(patientStatus);
  });

  it.each([ENCOUNTER_TYPES.SURVEY_RESPONSE, ENCOUNTER_TYPES.VACCINATION])(
    'gives a %s encounter no status',
    encounterType => {
      expect(getPatientStatus(encounterType)).toBeUndefined();
    },
  );

  it('gives no status without an encounter', () => {
    expect(getPatientStatus(undefined)).toBe('');
  });
});
