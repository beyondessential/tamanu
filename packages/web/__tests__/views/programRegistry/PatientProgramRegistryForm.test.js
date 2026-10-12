import { describe, it, expect } from 'vitest';
import * as yup from 'yup';

import { getRelatedConditionsSchema } from '../../../app/views/programRegistry/PatientProgramRegistryForm';

const validate = (mandatoryConditionEnabled, conditions) =>
  yup
    .object({ conditions: getRelatedConditionsSchema(mandatoryConditionEnabled, '*Required') })
    .validate({ conditions });

describe('getRelatedConditionsSchema', () => {
  describe('when the registry requires a related condition', () => {
    it.each([
      ['no conditions', undefined],
      ['an empty list', []],
      ['only a blank row', [{ conditionId: null, conditionCategoryId: null }]],
    ])('rejects %s on the first condition field', async (_, conditions) => {
      await expect(validate(true, conditions)).rejects.toMatchObject({
        path: 'conditions[0].conditionId',
        message: '*Required',
      });
    });

    it('accepts a condition with a category', async () => {
      await expect(
        validate(true, [{ conditionId: 'condition-1', conditionCategoryId: 'confirmed' }]),
      ).resolves.toBeTruthy();
    });
  });

  describe('when the registry does not require a related condition', () => {
    it.each([
      ['no conditions', undefined],
      ['an empty list', []],
    ])('accepts %s', async (_, conditions) => {
      await expect(validate(false, conditions)).resolves.toBeTruthy();
    });
  });
});
