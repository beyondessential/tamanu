import { describe, it, expect } from 'vitest';
import {
  getAnnualIncomeOptions,
  getAssessmentDiscount,
  getAssessmentInitialValues,
  getAssessmentValidationSchema,
} from '../../../app/features/Invoice/InvoiceDiscountModal/InvoiceDiscountAssessmentForm';

// A family size is the number of people, so the scale's first row is a family of one. The
// patient's billing details store the same number, which is what lets the assessment open on it.
const FAMILY_SIZE_OF_THREE = '3';
const FAMILY_SIZE_OF_FOUR = '4';

const SLIDING_FEE_SCALE = [
  [1000, 5000, 11000],
  [2000, 6000, 14000],
  [3000, 7400, 17000],
  [4000, 9000, 21000],
];

const REQUIRED_MESSAGE = '*Required';

const validate = values =>
  getAssessmentValidationSchema(SLIDING_FEE_SCALE, REQUIRED_MESSAGE).validateSync(values);

describe('getAnnualIncomeOptions', () => {
  it('builds a band per income, with the last one open-ended', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, FAMILY_SIZE_OF_THREE)).toEqual([
      { value: '3,000 - 7,400', label: '3,000 - 7,400', percentage: 0.2 },
      { value: '7,400 - 17,000', label: '7,400 - 17,000', percentage: 0.3 },
      { value: '> 17,000', label: '> 17,000', percentage: 0.4 },
    ]);
  });

  it('has no bands for a family size the sliding fee scale does not cover', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '12')).toEqual([]);
  });

  it('has no bands until a family size is chosen', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, '')).toEqual([]);
  });
});

describe('getAssessmentDiscount', () => {
  it('discounts the remainder of the proportion the patient pays', () => {
    const options = getAnnualIncomeOptions(SLIDING_FEE_SCALE, FAMILY_SIZE_OF_THREE);

    // 7,400 - 17,000 at a family size of 3 is a 70% discount
    expect(getAssessmentDiscount(options, '7,400 - 17,000')).toEqual({
      percentage: '0.70',
      isManual: false,
    });
  });
});

describe('getAssessmentValidationSchema', () => {
  it('accepts an income band belonging to the selected family size', () => {
    expect(() =>
      validate({ familySize: FAMILY_SIZE_OF_THREE, annualIncome: '> 17,000' }),
    ).not.toThrow();
  });

  // The message for a missing value comes from the app-wide yup locale (registerYup), which
  // is not installed here, so these assert only that the value is rejected
  it('requires an annual income', () => {
    expect(() => validate({ familySize: FAMILY_SIZE_OF_THREE })).toThrow();
  });

  it('requires an annual income once the field has been cleared', () => {
    expect(() => validate({ familySize: FAMILY_SIZE_OF_THREE, annualIncome: '' })).toThrow();
  });

  it('rejects an income band that belongs to a different family size', () => {
    // Regression: picking a band at a family size of 3, then changing family size, must not
    // leave the earlier band standing as a valid answer for the new family size. It reads as a
    // missing answer rather than leaking the available bands into the message.
    expect(() =>
      validate({
        familySize: FAMILY_SIZE_OF_FOUR,
        annualIncome: '7,400 - 17,000',
      }),
    ).toThrow(REQUIRED_MESSAGE);
  });

  it('requires a family size', () => {
    expect(() => validate({ annualIncome: '> 17,000' })).toThrow();
  });
});

describe('getAssessmentInitialValues', () => {
  it('opens on the answers saved against the patient', () => {
    expect(
      getAssessmentInitialValues(SLIDING_FEE_SCALE, {
        familySize: FAMILY_SIZE_OF_THREE,
        annualIncome: '7,400 - 17,000',
      }),
    ).toEqual({ familySize: FAMILY_SIZE_OF_THREE, annualIncome: '7,400 - 17,000' });
  });

  it('asks both questions afresh when the patient has no saved family size', () => {
    expect(getAssessmentInitialValues(SLIDING_FEE_SCALE, {})).toEqual({});
    expect(getAssessmentInitialValues(SLIDING_FEE_SCALE, undefined)).toEqual({});
  });

  it('keeps the family size but drops a band the scale no longer lists', () => {
    expect(
      getAssessmentInitialValues(SLIDING_FEE_SCALE, {
        familySize: FAMILY_SIZE_OF_THREE,
        annualIncome: '1 - 2',
      }),
    ).toEqual({ familySize: FAMILY_SIZE_OF_THREE });
  });

  // A shrunk scale would otherwise show a family size that is not on offer, with no income bands
  // to go with it and nothing valid to choose.
  it('drops a saved family size the scale no longer covers', () => {
    expect(
      getAssessmentInitialValues(SLIDING_FEE_SCALE, {
        familySize: '12',
        annualIncome: '7,400 - 17,000',
      }),
    ).toEqual({});
  });
});
