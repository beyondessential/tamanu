import { describe, expect, it } from 'vitest';
import { VACCINE_STATUS } from '@tamanu/constants';
import { administeredVaccineStatusToHL7Status } from '../../../src/routes/fhir/patientSummary/utils';

describe('administeredVaccineStatusToHL7Status', () => {
  it.each(Object.values(VACCINE_STATUS))('maps %s to an HL7 status', status => {
    expect(['completed', 'entered-in-error', 'not-done']).toContain(
      administeredVaccineStatusToHL7Status(status),
    );
  });

  it('maps HISTORICAL to not-done', () => {
    expect(administeredVaccineStatusToHL7Status(VACCINE_STATUS.HISTORICAL)).toBe('not-done');
  });

  it('throws on an unknown status', () => {
    expect(() => administeredVaccineStatusToHL7Status('NOT_A_STATUS')).toThrow();
  });
});
