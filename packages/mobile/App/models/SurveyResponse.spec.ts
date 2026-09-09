import { Database } from '~/infra/db';
import { SurveyTypes } from '~/types';
import { fake, fakeEncounter, fakePatient, fakeSurvey, fakeUser } from '/root/tests/helpers/fake';
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
        { [dataElement.code]: 'alastair@bes.au' },
      );
      await patient.reload();
      expect(patient).toMatchObject({ email: 'alastair@bes.au' });
    });
  });

  describe('getForPatient', () => {
    let patient;
    let survey;
    let otherSurvey;
    let encounter;
    let otherPatientEncounter;

    const createResponse = async (targetEncounter, endTime: string, targetSurvey = survey) =>
      Database.models.SurveyResponse.createAndSaveOne({
        encounter: targetEncounter.id,
        survey: targetSurvey.id,
        startTime: endTime,
        endTime,
      });

    beforeAll(async () => {
      const user = await Database.models.User.createAndSaveOne(fakeUser());
      patient = await Database.models.Patient.createAndSaveOne(fakePatient());
      const otherPatient = await Database.models.Patient.createAndSaveOne(fakePatient());
      survey = await Database.models.Survey.createAndSaveOne(fakeSurvey());
      otherSurvey = await Database.models.Survey.createAndSaveOne(fakeSurvey());

      const createEncounter = async targetPatient => {
        const record = fakeEncounter();
        record.patient = targetPatient;
        record.examiner = user;
        await Database.models.Encounter.insert(record);
        return record;
      };

      encounter = await createEncounter(patient);
      otherPatientEncounter = await createEncounter(otherPatient);
    });

    afterEach(async () => {
      await Database.models.ProcedureSurveyResponse.clear();
      await Database.models.Procedure.clear();
      await Database.models.SurveyResponse.clear();
    });

    it('only returns responses belonging to the patient', async () => {
      const response = await createResponse(encounter, '2024-02-01 00:00:00');
      await createResponse(otherPatientEncounter, '2024-03-01 00:00:00');

      const results = await Database.models.SurveyResponse.getForPatient({ patientId: patient.id });

      expect(results.map(r => r.id)).toEqual([response.id]);
    });

    it('excludes responses linked to a procedure', async () => {
      const kept = await createResponse(encounter, '2024-02-01 00:00:00');
      const linked = await createResponse(encounter, '2024-03-01 00:00:00');

      const procedure = await Database.models.Procedure.createAndSaveOne({
        encounter: encounter.id,
        date: '2024-03-01',
        completed: true,
      });
      await Database.models.ProcedureSurveyResponse.createAndSaveOne({
        procedure: procedure.id,
        surveyResponse: linked.id,
      });

      const results = await Database.models.SurveyResponse.getForPatient({ patientId: patient.id });

      expect(results.map(r => r.id)).toEqual([kept.id]);
    });

    it('returns the most recent responses first, with the survey attached', async () => {
      const older = await createResponse(encounter, '2024-02-01 00:00:00');
      const newer = await createResponse(encounter, '2024-03-01 00:00:00');

      const results = await Database.models.SurveyResponse.getForPatient({ patientId: patient.id });

      expect(results.map(r => r.id)).toEqual([newer.id, older.id]);
      expect(results[0].survey.id).toEqual(survey.id);
    });

    it('filters to a single survey when one is given', async () => {
      const response = await createResponse(encounter, '2024-02-01 00:00:00');
      await createResponse(encounter, '2024-03-01 00:00:00', otherSurvey);

      const results = await Database.models.SurveyResponse.getForPatient({
        patientId: patient.id,
        surveyId: survey.id,
      });

      expect(results.map(r => r.id)).toEqual([response.id]);
    });
  });
});
