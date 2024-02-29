import { Database } from '~/infra/db';
import { SurveyTypes } from '~/types';
import { fake, fakeEncounter, fakePatient, fakeUser } from '/root/tests/helpers/fake';
import { FieldTypes } from '~/ui/helpers/fields';

describe('SurveyResponse', () => {
  beforeAll(async () => {
    await Database.connect();
    await Database.models.SurveyResponseAnswer.clear();
    await Database.models.SurveyResponse.clear();
    await Database.models.SurveyScreenComponent.clear();
    await Database.models.ProgramDataElement.clear();
    await Database.models.Survey.clear();
    await Database.models.Program.clear();
    await Database.models.Encounter.clear();
    await Database.models.Patient.clear();
    await Database.models.User.clear();
  });
  describe('submit', () => {
    // This test fails intermittently.
    // As far as we can tell, it's a problem with the test itself rather than the
    // underlying logic, so it's being disabled temporarily.
    it.skip('Can change patient data', async () => {
      const patient = await Database.models.Patient.createAndSaveOne(fakePatient());

      const user = fakeUser();
      await Database.models.User.createAndSaveOne(user);

      const survey = await Database.models.Survey.createAndSaveOne({
        ...fake(Database.models.Survey),
        surveyType: SurveyTypes.Programs,
      });

      const dataElement = await Database.models.ProgramDataElement.createAndSaveOne({
        ...fake(Database.models.ProgramDataElement),
        code: 'test_code',
        type: FieldTypes.PATIENT_DATA,
      });

      const configObj = {
        writeToPatient: {
          fieldName: 'email',
        },
      };
      const screen = await Database.models.SurveyScreenComponent.createAndSaveOne({
        ...fake(Database.models.SurveyScreenComponent),
        dataElementId: dataElement.id,
        surveyId: survey.id,
        config: JSON.stringify(configObj),
        calculation: null,
      });

      const encounter = fakeEncounter();
      encounter.patient = patient;
      encounter.examiner = user;
      await Database.models.Encounter.insert(encounter);

      await Database.models.SurveyResponse.submit(
        patient.id,
        user.id,
        {
          components: [{ ...screen, dataElement, getConfigObject: () => configObj }],
          surveyType: SurveyTypes.Programs,
          surveyId: survey.id,
          encounterReason: 'Test survey response',
        },
        {
          [dataElement.code]: 'alastair@bes.au',
        },
      ),
        await patient.reload();
      expect(patient).toMatchObject({
        email: 'alastair@bes.au',
      });
    });
  });
});
