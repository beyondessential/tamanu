import { describe, expect, it } from 'vitest';
import { VACCINE_STATUS } from '@tamanu/constants';
import { administeredVaccineStatusToHL7Status } from '../../../src/routes/fhir/patientSummary/utils';

describe('administeredVaccineStatusToHL7Status', () => {
  it('maps every vaccine status to its HL7 status', () => {
    const expectedHL7Statuses = {
      [VACCINE_STATUS.UNKNOWN]: 'not-done',
      [VACCINE_STATUS.GIVEN]: 'completed',
      [VACCINE_STATUS.NOT_GIVEN]: 'not-done',
      [VACCINE_STATUS.SCHEDULED]: 'not-done',
      [VACCINE_STATUS.MISSED]: 'not-done',
      [VACCINE_STATUS.DUE]: 'not-done',
      [VACCINE_STATUS.UPCOMING]: 'not-done',
      [VACCINE_STATUS.OVERDUE]: 'not-done',
      [VACCINE_STATUS.RECORDED_IN_ERROR]: 'entered-in-error',
      [VACCINE_STATUS.HISTORICAL]: 'not-done',
    };

    const actualHL7Statuses = Object.fromEntries(
      Object.values(VACCINE_STATUS).map(status => [
        status,
        administeredVaccineStatusToHL7Status(status),
      ]),
    );

    expect(actualHL7Statuses).toEqual(expectedHL7Statuses);
  });

  it('throws on an unknown status', () => {
    expect(() => administeredVaccineStatusToHL7Status('NOT_A_STATUS')).toThrow();
  });
});
