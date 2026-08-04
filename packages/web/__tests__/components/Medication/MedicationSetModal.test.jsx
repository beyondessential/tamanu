import { describe, it, expect } from 'vitest';
import { ADMINISTRATION_FREQUENCIES, MEDICATION_DURATION_UNITS } from '@tamanu/constants';

import { buildMedicationSetPrescription } from '../../../app/components/Medication/MedicationSetModal';

// A medication-set template as it arrives from the medicationSet suggester: the template fields
// plus the nested drug reference data the frontend relies on for autocalculation.
const buildTemplate = overrides => ({
  medication: {
    id: 'drug-1',
    name: 'Paracetamol',
    referenceDrug: { dispensingUnit: 'Tablet', unitConversion: 250 },
  },
  frequency: ADMINISTRATION_FREQUENCIES.DAILY,
  route: 'oral',
  doseAmount: 500,
  dosingUnit: 'mg',
  durationValue: 10,
  durationUnit: MEDICATION_DURATION_UNITS.DAYS,
  ...overrides,
});

const context = {
  startDate: '2024-03-15 08:00:00',
  date: '2024-03-15',
  prescriberId: 'user-1',
  isDispensingQuantityAutocalculationEnabled: true,
};

describe('buildMedicationSetPrescription', () => {
  it('snapshots the dispensing unit and conversion from the reference drug', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), context);
    expect(child.dispensingUnit).toBe('Tablet');
    expect(child.unitConversion).toBe(250);
  });

  it('autocalculates the dispensing quantity when the setting is enabled', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), context);
    // 500 dosing units × 1 dose/day × 10 days ÷ 250 units-per-tablet = 20 tablets
    expect(child.quantity).toBe(20);
  });

  it('does not set a quantity when autocalculation is disabled', () => {
    const child = buildMedicationSetPrescription(buildTemplate(), {
      ...context,
      isDispensingQuantityAutocalculationEnabled: false,
    });
    expect(child.quantity).toBeUndefined();
  });

  it('does not set a quantity when the template is not calculable (variable dose)', () => {
    const child = buildMedicationSetPrescription(
      buildTemplate({ isVariableDose: true, doseAmount: undefined }),
      context,
    );
    expect(child.quantity).toBeUndefined();
  });

  describe('missing reference drug', () => {
    it('falls back to a blank dispensing unit and a conversion of 1', () => {
      const child = buildMedicationSetPrescription(
        buildTemplate({ medication: { id: 'drug-2', name: 'Amoxicillin' } }),
        context,
      );
      expect(child.dispensingUnit).toBe('');
      expect(child.unitConversion).toBe(1);
    });

    it('still autocalculates using the fallback conversion of 1', () => {
      const child = buildMedicationSetPrescription(
        buildTemplate({ medication: { id: 'drug-2', name: 'Amoxicillin' } }),
        context,
      );
      // With a conversion of 1: 500 × 1/day × 10 days ÷ 1 = 5000
      expect(child.quantity).toBe(5000);
    });
  });
});
