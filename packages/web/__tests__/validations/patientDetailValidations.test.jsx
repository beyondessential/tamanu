import { describe, it, expect, beforeAll } from 'vitest';
import { PATIENT_REGISTRY_TYPES } from '@tamanu/constants';
import { globalDefaults } from '@tamanu/settings';
import { registerYup } from '../../app/utils/errorMessages';
import { getPatientDetailsValidation } from '../../app/validations/patientDetailValidations';

// translatedLabel and the "*Required" locale are installed at app boot
registerYup();

const SLIDING_FEE_SCALE_PLAN_ID = 'plan-sliding-fee-scale';
const OTHER_PLAN_ID = 'plan-something-else';

const FAMILY_SIZE_MESSAGE = 'Family size is required for sliding fee scale';
const ANNUAL_INCOME_MESSAGE = 'Annual income is required for sliding fee scale';

// The real defaults, so this also holds getPatientDetailsValidation to its own rule that every
// configurable patient field has a validation entry.
const getSetting = path => (path === 'fields' ? globalDefaults.fields : undefined);
const getTranslation = (_stringId, fallback) => fallback;

const buildSchema = (slidingFeeScalePlanId = SLIDING_FEE_SCALE_PLAN_ID) =>
  getPatientDetailsValidation(
    PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    getSetting,
    getTranslation,
    [],
    slidingFeeScalePlanId,
  );

const REQUIRED_PATIENT = {
  firstName: 'Alex',
  lastName: 'Tovo',
  dateOfBirth: '1990-05-15',
  sex: 'female',
};

const validate = (schema, values) => schema.validateSync({ ...REQUIRED_PATIENT, ...values });

describe('getPatientDetailsValidation', () => {
  let schema;
  beforeAll(() => {
    schema = buildSchema();
  });

  it('covers every configurable patient field, including the billing ones', () => {
    const validated = Object.keys(schema.describe().fields);

    expect(validated).toEqual(
      expect.arrayContaining([
        'adoptionNumber',
        'marriageLicence',
        'familySize',
        'annualIncome',
        'payor1Id',
        'payor1ReferenceNumber',
        'payor2Id',
        'payor2ReferenceNumber',
      ]),
    );
    expect(validated).not.toContain('insurerId');
  });

  describe('the sliding fee scale requirement', () => {
    it('leaves family size and annual income optional without the plan', () => {
      expect(() => validate(schema, { invoiceInsurancePlanId: [OTHER_PLAN_ID] })).not.toThrow();
    });

    it('leaves them optional when no insurance plan is chosen at all', () => {
      expect(() => validate(schema, {})).not.toThrow();
      expect(() => validate(schema, { invoiceInsurancePlanId: [] })).not.toThrow();
    });

    it('requires a family size once the plan is chosen', () => {
      expect(() =>
        validate(schema, { invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID] }),
      ).toThrow(FAMILY_SIZE_MESSAGE);
    });

    it('requires an annual income once a family size is given', () => {
      expect(() =>
        validate(schema, {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
          familySize: '3',
        }),
      ).toThrow(ANNUAL_INCOME_MESSAGE);
    });

    it('accepts the patient once both are answered', () => {
      expect(() =>
        validate(schema, {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
          familySize: '3',
          annualIncome: '7,400 - 17,000',
        }),
      ).not.toThrow();
    });

    it('applies when the plan is one of several', () => {
      expect(() =>
        validate(schema, {
          invoiceInsurancePlanId: [OTHER_PLAN_ID, SLIDING_FEE_SCALE_PLAN_ID],
        }),
      ).toThrow(FAMILY_SIZE_MESSAGE);
    });

    // The plan is matched by the id resolved from the configured code. Until the plans load, or
    // where no plan carries that code, there is nothing to key the requirement on.
    it('does not fire when no sliding fee scale plan is configured', () => {
      expect(() =>
        validate(buildSchema(null), {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
        }),
      ).not.toThrow();
    });
  });
});
