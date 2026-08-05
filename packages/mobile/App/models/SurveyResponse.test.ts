import { Database } from '~/infra/db';
import { SurveyTypes } from '~/types';
import {
  fakePatient,
  fakeProgramDataElement,
  fakeSurvey,
  fakeUser,
} from '/root/tests/helpers/fake';
import { writeConfig } from '~/services/config';
import { SurveyResponse } from './SurveyResponse';

// Regression coverage for the survey submit partial-commit fix.
//
// SurveyResponse.submit persists an encounter, a response row and its answers inside a
// single TypeORM transaction. Previously the try/catch lived INSIDE the transaction
// callback: when a mid-submit error was caught the callback returned null and resolved
// normally, so TypeORM committed everything written up to the point of failure. The fix
// moves the try/catch to wrap the transaction so the error propagates out of the callback,
// rolling the transaction back, while still returning null to signal failure to the caller.
//
// These tests drive a submit that throws partway through (an answer whose code has no
// matching screen component) and assert that nothing is left persisted.
describe('SurveyResponse.submit', () => {
  let patientId: string;
  let userId: string;
  let surveyId: string;
  let dataElement: ReturnType<typeof fakeProgramDataElement>;
  const orphanCode = 'ORPHAN_CODE_WITH_NO_COMPONENT';

  const clearSubmitTables = async () => {
    // SQLite deletes row-by-row, so drop FK enforcement while clearing children before parents.
    await Database.client.query('PRAGMA foreign_keys = OFF;');
    await Database.models.VitalLog.clear();
    await Database.models.SurveyResponseAnswer.clear();
    await Database.models.SurveyResponse.clear();
    await Database.models.Encounter.clear();
    await Database.client.query('PRAGMA foreign_keys = ON;');
  };

  const buildSurveyData = () => ({
    surveyId,
    surveyType: SurveyTypes.Programs,
    encounterReason: 'survey response test',
    components: [
      {
        id: 'survey-screen-component-valid',
        dataElement,
        calculation: '',
      },
    ],
  });

  beforeAll(async () => {
    await Database.connect();

    const facility = await Database.models.Facility.createAndSaveOne({ name: 'Test Facility' });
    await writeConfig('facilityId', facility.id);
    await Database.models.Department.createAndSaveOne({ name: 'Test Dept', facility: facility.id });
    await Database.models.Location.createAndSaveOne({ name: 'Test Loc', facility: facility.id });

    const user = fakeUser();
    await Database.models.User.insert(user);
    userId = user.id;

    const patient = fakePatient();
    await Database.models.Patient.insert(patient);
    patientId = patient.id;

    const survey = fakeSurvey();
    await Database.models.Survey.insert(survey);
    surveyId = survey.id;

    dataElement = fakeProgramDataElement();
    await Database.models.ProgramDataElement.insert(dataElement);
  });

  beforeEach(async () => {
    await clearSubmitTables();
  });

  it('persists an encounter, response and answer on a successful submit', async () => {
    const setNote = jest.fn();
    const result = await SurveyResponse.submit(
      patientId,
      userId,
      buildSurveyData(),
      { [dataElement.code]: 'A recorded answer' },
      setNote,
    );

    expect(result).not.toBeNull();
    expect(result.id).toBeTruthy();
    expect(await Database.models.Encounter.count()).toBe(1);
    expect(await Database.models.SurveyResponse.count()).toBe(1);
    expect(await Database.models.SurveyResponseAnswer.count()).toBe(1);
  });

  it('rolls back all writes when an answer errors partway through the submit', async () => {
    const encountersBefore = await Database.models.Encounter.count();
    const responsesBefore = await Database.models.SurveyResponse.count();
    const answersBefore = await Database.models.SurveyResponseAnswer.count();

    const setNote = jest.fn();
    // The first value maps to a valid component (its answer would be written first), the second
    // has no matching component so submit throws mid-transaction after a partial write.
    const result = await SurveyResponse.submit(
      patientId,
      userId,
      buildSurveyData(),
      {
        [dataElement.code]: 'A recorded answer',
        [orphanCode]: 'orphaned value',
      },
      setNote,
    );

    // Failure is reported to the caller as a null result...
    expect(result).toBeNull();
    // ...and the reported error is the mid-submit "no screen component" failure, not something else.
    expect(setNote).toHaveBeenCalledWith(expect.stringContaining('no screen component'));

    // ...and crucially nothing partial is committed: counts are unchanged (all zero here).
    expect(await Database.models.Encounter.count()).toBe(encountersBefore);
    expect(await Database.models.SurveyResponse.count()).toBe(responsesBefore);
    expect(await Database.models.SurveyResponseAnswer.count()).toBe(answersBefore);
    expect(await Database.models.SurveyResponse.count()).toBe(0);
    expect(await Database.models.SurveyResponseAnswer.count()).toBe(0);
  });
});
