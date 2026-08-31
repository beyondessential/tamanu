import { describe, it, expect } from 'vitest';
import {
  getAnnualIncomeOptions,
  getAssessmentDiscount,
  getAssessmentValidationSchema,
} from '../../../app/features/Invoice/InvoiceDiscountModal/InvoiceDiscountAssessmentForm';

// Family size is a zero-based index into the sliding fee scale setting
const FAMILY_SIZE_OF_THREE = 2;
const FAMILY_SIZE_OF_FOUR = 3;

const SLIDING_FEE_SCALE = {
  [FAMILY_SIZE_OF_THREE]: [3000, 7400, 17000],
  [FAMILY_SIZE_OF_FOUR]: [4000, 9000, 21000],
};

const REQUIRED_MESSAGE = '*Required';

const validate = (annualIncomeOptions, values) =>
  getAssessmentValidationSchema(annualIncomeOptions, REQUIRED_MESSAGE).validateSync(values);

describe('getAnnualIncomeOptions', () => {
  it('builds a band per income, with the last one open-ended', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, FAMILY_SIZE_OF_THREE)).toEqual([
      { value: '3,000 - 7,400', label: '3,000 - 7,400', percentage: 0.2 },
      { value: '7,400 - 17,000', label: '7,400 - 17,000', percentage: 0.3 },
      { value: '> 17,000', label: '> 17,000', percentage: 0.4 },
    ]);
  });

  it('has no bands for a family size the sliding fee scale does not cover', () => {
    expect(getAnnualIncomeOptions(SLIDING_FEE_SCALE, 11)).toEqual([]);
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
  const options = getAnnualIncomeOptions(SLIDING_FEE_SCALE, FAMILY_SIZE_OF_THREE);

  it('accepts an income band belonging to the selected family size', () => {
    expect(() =>
      validate(options, { familySize: String(FAMILY_SIZE_OF_THREE), annualIncome: '> 17,000' }),
    ).not.toThrow();
  });

  // The message for a missing value comes from the app-wide yup locale (registerYup), which
  // is not installed here, so these assert only that the value is rejected
  it('requires an annual income', () => {
    expect(() => validate(options, { familySize: String(FAMILY_SIZE_OF_THREE) })).toThrow();
  });

  it('requires an annual income once the field has been cleared', () => {
    expect(() =>
      validate(options, { familySize: String(FAMILY_SIZE_OF_THREE), annualIncome: '' }),
    ).toThrow();
  });

  it('rejects an income band that belongs to a different family size', () => {
    // Regression: picking a band at a family size of 3, then changing family size, must not
    // leave the earlier band standing as a valid answer for the new family size. It reads as a
    // missing answer rather than leaking the available bands into the message.
    const optionsForFour = getAnnualIncomeOptions(SLIDING_FEE_SCALE, FAMILY_SIZE_OF_FOUR);

    expect(() =>
      validate(optionsForFour, {
        familySize: String(FAMILY_SIZE_OF_FOUR),
        annualIncome: '7,400 - 17,000',
      }),
    ).toThrow(REQUIRED_MESSAGE);
  });

  it('requires a family size', () => {
    expect(() => validate(options, { annualIncome: '> 17,000' })).toThrow();
  });
});
