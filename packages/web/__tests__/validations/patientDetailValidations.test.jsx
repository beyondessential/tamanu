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

const getTranslation = (_stringId, fallback) => fallback;

// The real defaults, so this also holds getPatientDetailsValidation to its own rule that every
// configurable patient field has a validation entry. `hiddenFields` overrides the handful of
// field settings a case cares about.
const makeGetSetting = (hiddenFields = [], requiredWhenCreatingFields = []) => path => {
  if (path === 'fields') return globalDefaults.fields;
  if (hiddenFields.some(field => path === `fields.${field}.hidden`)) return true;
  if (requiredWhenCreatingFields.some(field => path === `fields.${field}.requiredPatientData`))
    return true;
  return undefined;
};

const buildSchema = ({
  slidingFeeScalePlanId = SLIDING_FEE_SCALE_PLAN_ID,
  hiddenFields = [],
  requiredWhenCreatingFields = [],
} = {}) =>
  getPatientDetailsValidation(
    PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    makeGetSetting(hiddenFields, requiredWhenCreatingFields),
    getTranslation,
    { slidingFeeScalePlanId },
  );

const REQUIRED_PATIENT = {
  firstName: 'Alex',
  lastName: 'Tovo',
  dateOfBirth: '1990-05-15',
  sex: 'female',
};

const validate = (schema, values) => schema.validateSync({ ...REQUIRED_PATIENT, ...values });

// Which fields a case fails on, rather than only that it failed: a requirement that lands on the
// wrong field is the defect these cover.
const errorPaths = (schema, values) => {
  try {
    schema.validateSync({ ...REQUIRED_PATIENT, ...values }, { abortEarly: false });
    return [];
  } catch (error) {
    return error.inner.map(each => each.path);
  }
};

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

    // A deployment that hides these fields is not collecting them. Requiring them anyway would
    // make the patient unsavable with no field on the form to answer.
    it('does not require a hidden family size', () => {
      expect(() =>
        validate(buildSchema({ hiddenFields: ['familySize'] }), {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
        }),
      ).not.toThrow();
    });

    it('does not require a hidden annual income', () => {
      expect(() =>
        validate(buildSchema({ hiddenFields: ['annualIncome'] }), {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
          familySize: '3',
        }),
      ).not.toThrow();
    });

    // Annual income is disabled until a family size is chosen, so requiring it while family size
    // is hidden would leave a permanently disabled field blocking the save, with no way to fix it.
    it('does not require an annual income the deployment marked mandatory while family size is hidden', () => {
      expect(() =>
        validate(
          buildSchema({
            hiddenFields: ['familySize'],
            requiredWhenCreatingFields: ['annualIncome'],
          }),
          {},
        ),
      ).not.toThrow();
    });

    it('still requires a mandatory annual income when family size is available', () => {
      expect(() =>
        validate(buildSchema({ requiredWhenCreatingFields: ['annualIncome'] }), {}),
      ).toThrow();
    });

    // Annual income stays disabled until a family size is chosen, so asking only for the income
    // refuses the save against a field nobody can fill in, and the form has nothing to point at.
    it('asks for the family size behind a mandatory annual income', () => {
      expect(
        errorPaths(buildSchema({ requiredWhenCreatingFields: ['annualIncome'] }), {}),
      ).toContain('familySize');
    });

    it('asks for the mandatory annual income once a family size is given', () => {
      expect(
        errorPaths(buildSchema({ requiredWhenCreatingFields: ['annualIncome'] }), {
          familySize: '3',
        }),
      ).toContain('annualIncome');
    });

    it('leaves the family size optional where the annual income is not mandatory', () => {
      expect(errorPaths(buildSchema(), {})).not.toContain('familySize');
    });

    // The plan is matched by the id resolved from the configured code. Until the plans load, or
    // where no plan carries that code, there is nothing to key the requirement on.
    it('does not fire when no sliding fee scale plan is configured', () => {
      expect(() =>
        validate(buildSchema({ slidingFeeScalePlanId: null }), {
          invoiceInsurancePlanId: [SLIDING_FEE_SCALE_PLAN_ID],
        }),
      ).not.toThrow();
    });
  });
});
