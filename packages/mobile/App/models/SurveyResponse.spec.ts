import { Database } from '~/infra/db';
import { SurveyTypes } from '~/types';
import { fakePatient, fakeEncounter, fakeUser, fake, createWithRelations } from '/root/tests/helpers/fake';
import { FieldTypes } from '~/ui/helpers/fields';

beforeAll(async () => {
  await Database.connect();
});

describe('SurveyResponse', () => {
  describe('submit', () => {
    it("Can change patient data", async () => {
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
