import { SEX_VALUES } from '@tamanu/constants';
import { describe, expect, it } from 'vitest';
import { getReferenceRange, getReferenceRangeWithUnit } from '../src/labTests';

const getTranslation = (
  _stringId: string,
  fallback: string,
  translationOptions?: {
    casing?: 'lower' | 'upper' | 'sentence';
    replacements?: Record<string, any>;
  },
) => {
  let translated = fallback;
  Object.entries(translationOptions?.replacements ?? {}).forEach(([key, value]) => {
    translated = translated.replace(`:${key}`, String(value));
  });
  return translated;
};

describe('getReferenceRange', () => {
  it('uses test type range when there is no override', () => {
    expect(
      getReferenceRange({
        labTestType: { maleMin: 5, maleMax: 20, femaleMin: 4, femaleMax: 18 },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('5–20');
  });

  it('uses an override minimum with the test type maximum', () => {
    expect(
      getReferenceRange({
        labTestType: { maleMin: 1, maleMax: 20 },
        labTest: { referenceRangeMin: 5, referenceRangeMax: null },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('5–20');
  });

  it('uses the test type minimum with an override maximum', () => {
    expect(
      getReferenceRange({
        labTestType: { maleMin: 5, maleMax: 20 },
        labTest: { referenceRangeMin: null, referenceRangeMax: 10 },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('5–10');
  });

  it('keeps zero-valued override bounds', () => {
    expect(
      getReferenceRange({
        labTestType: { maleMin: 5, maleMax: 20 },
        labTest: { referenceRangeMin: 0, referenceRangeMax: 10 },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('0–10');
  });

  it('falls back to one-sided ranges when neither source has the other bound', () => {
    expect(
      getReferenceRange({
        labTestType: { maleMax: 20 },
        labTest: { referenceRangeMin: 5, referenceRangeMax: null },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('5–20');

    expect(
      getReferenceRange({
        labTestType: { maleMin: null, maleMax: null },
        labTest: { referenceRangeMin: 5, referenceRangeMax: null },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('>5');
  });

  it('uses range text when there are no numeric bounds', () => {
    expect(
      getReferenceRange({
        labTestType: { rangeText: 'Negative' },
        labTest: { referenceRangeMin: null, referenceRangeMax: null },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('Negative');
  });
});

describe('getReferenceRangeWithUnit', () => {
  it('adds units to ranges built from override and test type bounds', () => {
    expect(
      getReferenceRangeWithUnit({
        labTestType: { maleMin: 5, maleMax: 20, unit: 'mmol/L' },
        labTest: { referenceRangeMin: null, referenceRangeMax: 10 },
        sex: SEX_VALUES.MALE,
        getTranslation,
      }),
    ).toBe('5–10 mmol/L');
  });
});
