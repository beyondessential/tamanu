import { describe, it, expect } from 'vitest';

import {
  buildInstructionText,
  buildLabelText,
  getDispensedMedication,
  isDispenseModifiedByPharmacy,
} from '../../app/utils/medications';

// Mirror the real translation helpers closely enough for formatting assertions:
// getTranslation falls back to the provided English, getEnumTranslation resolves
// the registered enum label (or the raw value when unmapped).
const getTranslation = (_stringId, fallback) => fallback;
const getEnumTranslation = (enumValues, value) => enumValues?.[value] ?? value;

const basePrescription = {
  units: 'Tablet',
  dosingUnit: 'Tablet',
  doseAmount: 1,
  frequency: 'Two times daily',
  route: 'oral',
  indication: 'back pain',
  notes: 'This is the medication note.',
};

describe('buildLabelText', () => {
  it('matches the TAM-6813 worked example', () => {
    expect(buildLabelText(basePrescription, getTranslation, getEnumTranslation)).toBe(
      'Take 1 tablet two times daily, oral, back pain. This is the medication note.',
    );
  });

  it('uses the plural long-form unit when the dose is greater than 1', () => {
    expect(
      buildLabelText({ ...basePrescription, doseAmount: 2 }, getTranslation, getEnumTranslation),
    ).toBe('Take 2 tablets two times daily, oral, back pain. This is the medication note.');
  });

  it('prefixes the verb configured for the dosing unit and pluralises correctly', () => {
    expect(
      buildLabelText(
        { units: 'Patch', doseAmount: 2, frequency: 'Daily', route: 'dermal' },
        getTranslation,
        getEnumTranslation,
      ),
    ).toBe('Apply 2 patches daily, dermal.');
  });

  it('keeps invariant units of measurement unchanged when plural', () => {
    expect(
      buildLabelText(
        { units: 'mg', doseAmount: 500, frequency: 'Daily' },
        getTranslation,
        getEnumTranslation,
      ),
    ).toBe('Give 500 mg daily.');
  });

  it("prefixes 'Inhale' for puffs (inhaler/puffer)", () => {
    expect(
      buildLabelText(
        { units: 'Puff', doseAmount: 2, frequency: 'Two times daily' },
        getTranslation,
        getEnumTranslation,
      ),
    ).toBe('Inhale 2 puffs two times daily.');
  });

  it('preserves the casing of acronym/symbol units and routes', () => {
    // 'IU' must not become 'iU', and route 'IM' must not become 'iM'.
    expect(
      buildLabelText(
        { units: 'IU', doseAmount: 2, frequency: 'Daily', route: 'intramuscular' },
        getTranslation,
        getEnumTranslation,
      ),
    ).toBe('Administer 2 IU daily, IM.');
  });

  it('leaves the Instructions text untouched (no verb, short capitalised units)', () => {
    expect(buildInstructionText(basePrescription, getTranslation, getEnumTranslation)).toBe(
      '1 tab Two times daily, Oral, back pain. This is the medication note.',
    );
  });
});

describe('isDispenseModifiedByPharmacy', () => {
  it('is true when the dispense has a modifiedAt', () => {
    expect(isDispenseModifiedByPharmacy({ modifiedAt: '2026-07-14 00:00:00' })).toBe(true);
  });

  it('is false when the dispense has no modifiedAt', () => {
    expect(isDispenseModifiedByPharmacy({ modifiedAt: null })).toBe(false);
    expect(isDispenseModifiedByPharmacy({})).toBe(false);
  });

  it('is false for a nullish dispense', () => {
    expect(isDispenseModifiedByPharmacy(undefined)).toBe(false);
    expect(isDispenseModifiedByPharmacy(null)).toBe(false);
  });
});

describe('getDispensedMedication', () => {
  const prescribed = { id: 'prescribed', name: 'Paracetamol' };
  const substitute = { id: 'substitute', name: 'Ibuprofen' };

  it('prefers the dispense own medication (a pharmacy substitution)', () => {
    const dispense = {
      medication: substitute,
      pharmacyOrderPrescription: { prescription: { medication: prescribed } },
    };
    expect(getDispensedMedication(dispense)).toBe(substitute);
  });

  it('falls back to the prescription medication when the dispense has none', () => {
    const dispense = {
      medication: null,
      pharmacyOrderPrescription: { prescription: { medication: prescribed } },
    };
    expect(getDispensedMedication(dispense)).toBe(prescribed);
  });
});
