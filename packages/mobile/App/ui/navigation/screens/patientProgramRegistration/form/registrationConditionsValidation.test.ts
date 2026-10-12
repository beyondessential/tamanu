import { getRegistrationConditionsValidation } from './registrationConditionsValidation';

const completeCondition = { condition: { value: 'condition-1' }, category: { value: 'confirmed' } };

describe('getRegistrationConditionsValidation', () => {
  describe('when the registry requires a related condition', () => {
    const schema = getRegistrationConditionsValidation(true, '*Required');

    it.each([
      ['no conditions field', undefined],
      ['an empty list', []],
      ['only a blank placeholder row', [{}]],
    ])('rejects %s', async (_, conditions) => {
      await expect(schema.validate(conditions)).rejects.toThrow('*Required');
    });

    it('accepts one condition with a category', async () => {
      await expect(schema.validate([completeCondition])).resolves.toBeTruthy();
    });
  });

  describe('when the registry does not require a related condition', () => {
    const schema = getRegistrationConditionsValidation(false, '*Required');

    it.each([
      ['no conditions field', undefined],
      ['an empty list', []],
    ])('accepts %s', async (_, conditions) => {
      await expect(schema.validate(conditions)).resolves.not.toThrow();
    });
  });
});
