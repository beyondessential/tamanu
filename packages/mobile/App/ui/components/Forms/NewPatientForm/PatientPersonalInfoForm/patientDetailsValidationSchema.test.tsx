import '~/ui/helpers/yupMethods';
import { getPatientDetailsValidation } from './patientDetailsValidationSchema';

const basePayload = {
  firstName: 'Test',
  lastName: 'Patient',
  dateOfBirth: new Date('2000-01-01'),
  sex: 'female',
};

describe('getPatientDetailsValidation', () => {
  it('rejects a payload missing villageId when fields.villageId.requiredPatientData is true', async () => {
    const getSetting = jest.fn(key => {
      if (key === 'fields.villageId.requiredPatientData') return true;
      return false;
    });
    const schema = getPatientDetailsValidation(getSetting);

    await expect(schema.validate(basePayload)).rejects.toThrow();
  });

  it('accepts a payload including villageId when fields.villageId.requiredPatientData is true', async () => {
    const getSetting = jest.fn(key => {
      if (key === 'fields.villageId.requiredPatientData') return true;
      return false;
    });
    const schema = getPatientDetailsValidation(getSetting);

    await expect(
      schema.validate({ ...basePayload, villageId: 'village-1' }),
    ).resolves.toBeTruthy();
  });
});
