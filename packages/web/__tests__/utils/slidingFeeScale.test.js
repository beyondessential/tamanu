import { describe, it, expect } from 'vitest';
import {
  areAnySlidingFeeScaleFieldsShown,
  getAnnualIncomeOptions,
  getFamilySizeOptions,
  isSlidingFeeScaleFieldShown,
  withSavedAnnualIncome,
} from '../../app/utils/slidingFeeScale';

const SLIDING_FEE_SCALE = [
  [0, 5700, 10050],
  [0, 6600, 13500],
  [0, 7400, 17000],
];

describe('getFamilySizeOptions', () => {
  it('offers one family size per row of the scale, counted from 1', () => {
    expect(getFamilySizeOptions(SLIDING_FEE_SCALE)).toEqual([
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
    ]);
  });

  // Regression: the options used to stop at a hard-coded 12 regardless of the scale
  it('follows a scale with more rows than the default twelve', () => {
    const longScale = Array.from({ length: 15 }, () => [0, 100, 200]);

    expect(getFamilySizeOptions(longScale)).toHaveLength(15);
    expect(getFamilySizeOptions(longScale).at(-1)).toEqual({ label: '15', value: '15' });
  });

  it('offers nothing when the deployment has no scale', () => {
    expect(getFamilySizeOptions()).toEqual([]);
  });
});

describe('getAnnualIncomeOptions', () => {
  it('reads a family size as the number of people, not a row index', () => {
    // A family of one is the scale's first row
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '1').map(({ value }) => value)).toEqual([
      '0 - 5,700',
      '5,700 - 10,050',
      '> 10,050',
    ]);
  });

  it('leaves the highest band open-ended', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '3').at(-1)).toEqual({
      value: '> 17,000',
      label: '> 17,000',
      percentage: 0.4,
    });
  });

  it('offers nothing until a family size is chosen', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '')).toEqual([]);
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, undefined)).toEqual([]);
  });

  it('offers nothing for a family size the scale does not cover', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '4')).toEqual([]);
  });
});

describe('withSavedAnnualIncome', () => {
  const options = getAnnualIncomeOptions(SLIDING_FEE_SCALE, '1');

  it('keeps a saved band that is still one of the current ones', () => {
    expect(withSavedAnnualIncome(options, '5,700 - 10,050')).toEqual(options);
  });

  // The scale is a setting, so a deployment can edit a band out from under a saved answer.
  // It still has to read back as what was recorded.
  it('offers a saved band the scale no longer has', () => {
    expect(withSavedAnnualIncome(options, '1,000 - 2,000')).toEqual([
      ...options,
      { value: '1,000 - 2,000', label: '1,000 - 2,000' },
    ]);
  });

  it('adds nothing when the patient has no saved band', () => {
    expect(withSavedAnnualIncome(options, null)).toEqual(options);
    expect(withSavedAnnualIncome(options, '')).toEqual(options);
  });
});

// The validation and the query that resolves the plan both read this rule from here, so that
// hiding the fields cannot switch the requirement off in one place but not the other.
describe('which sliding fee scale fields are in play', () => {
  const getSetting = hidden => path => hidden.includes(path.replace(/^fields\.|\.hidden$/g, ''));

  it('treats a field as shown unless the deployment hides it', () => {
    expect(isSlidingFeeScaleFieldShown(getSetting([]), 'familySize')).toBe(true);
    expect(isSlidingFeeScaleFieldShown(getSetting(['familySize']), 'familySize')).toBe(false);
  });

  it('is in play while either field is still shown', () => {
    expect(areAnySlidingFeeScaleFieldsShown(getSetting([]))).toBe(true);
    expect(areAnySlidingFeeScaleFieldsShown(getSetting(['familySize']))).toBe(true);
    expect(areAnySlidingFeeScaleFieldsShown(getSetting(['annualIncome']))).toBe(true);
  });

  it('is out of play once both are hidden', () => {
    expect(areAnySlidingFeeScaleFieldsShown(getSetting(['familySize', 'annualIncome']))).toBe(
      false,
    );
  });
});
