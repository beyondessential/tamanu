import { Database } from '~/infra/db';
import {
  fakePatient,
  fakeProgramDataElement,
  fakeSurvey,
  fakeUser,
} from '/root/tests/helpers/fake';
import { writeConfig } from '~/services/config';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';

// Coverage for the query that backs program survey form visibility (see
// getProgramSurveysWithFormVisibility): it picks the latest answer per question code in SQL
// rather than loading the patient's whole answer history. These tests run against real SQLite
// so the raw SQL is actually parsed and executed, and pin down which answers count as "latest".
describe('SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes', () => {
  const CODE_A = 'LAST_ANSWER_CODE_A';
  const CODE_B = 'LAST_ANSWER_CODE_B';
  const CODE_UNANSWERED = 'LAST_ANSWER_CODE_UNANSWERED';
  const ALL_CODES = [CODE_A, CODE_B, CODE_UNANSWERED];

  let patientId: string;
  let otherPatientId: string;
  let surveyId: string;
  let encounterId: string;
  let otherEncounterId: string;
  const dataElementIdsByCode: Record<string, string> = {};

  const clearAnswerTables = async () => {
    // SQLite deletes row-by-row, so drop FK enforcement while clearing children before parents.
    await Database.client.query('PRAGMA foreign_keys = OFF;');
    await Database.models.VitalLog.clear();
    await Database.models.SurveyResponseAnswer.clear();
    await Database.models.SurveyResponse.clear();
    await Database.client.query('PRAGMA foreign_keys = ON;');
  };

  const createAnswer = async ({
    code,
    body,
    startTime,
    encounter = encounterId,
  }: {
    code: string;
    body: string | null;
    startTime: string;
    encounter?: string;
  }): Promise<SurveyResponseAnswer> => {
    const response = await Database.models.SurveyResponse.createAndSaveOne({
      encounter,
      survey: surveyId,
      startTime,
      endTime: startTime,
    });

    return Database.models.SurveyResponseAnswer.createAndSaveOne({
      response: response.id,
      dataElement: dataElementIdsByCode[code],
      body,
    });
  };

  beforeAll(async () => {
    await Database.connect();

    const facility = await Database.models.Facility.createAndSaveOne({ name: 'Test Facility' });
    await writeConfig('facilityId', facility.id);
    await Database.models.Department.createAndSaveOne({ name: 'Test Dept', facility: facility.id });
    await Database.models.Location.createAndSaveOne({ name: 'Test Loc', facility: facility.id });

    const user = fakeUser();
    await Database.models.User.insert(user);

    const patient = fakePatient();
    await Database.models.Patient.insert(patient);
    patientId = patient.id;

    const otherPatient = fakePatient();
    await Database.models.Patient.insert(otherPatient);
    otherPatientId = otherPatient.id;

    const survey = fakeSurvey();
    await Database.models.Survey.insert(survey);
    surveyId = survey.id;

    for (const code of ALL_CODES) {
      const dataElement = { ...fakeProgramDataElement(), code };
      await Database.models.ProgramDataElement.insert(dataElement);
      dataElementIdsByCode[code] = dataElement.id;
    }

    const encounter = await Database.models.Encounter.createEncounter(patientId, user.id);
    encounterId = encounter.id;

    const otherEncounter = await Database.models.Encounter.createEncounter(otherPatientId, user.id);
    otherEncounterId = otherEncounter.id;
  });

  beforeEach(async () => {
    await clearAnswerTables();
  });

  it('returns an empty map when no question codes are requested', async () => {
    expect(await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(patientId, [])).toEqual(
      {},
    );
  });

  it('returns the most recent answer per question code, and omits codes with no answer', async () => {
    await createAnswer({ code: CODE_A, body: 'older A', startTime: '2024-01-01 09:00:00' });
    await createAnswer({ code: CODE_A, body: 'newest A', startTime: '2024-06-01 09:00:00' });
    await createAnswer({ code: CODE_A, body: 'middle A', startTime: '2024-03-01 09:00:00' });
    await createAnswer({ code: CODE_B, body: 'only B', startTime: '2024-02-01 09:00:00' });

    const values = await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(
      patientId,
      ALL_CODES,
    );

    expect(values).toEqual({ [CODE_A]: 'newest A', [CODE_B]: 'only B' });
    expect(values).not.toHaveProperty(CODE_UNANSWERED);
  });

  it('ignores empty and null answers in favour of the latest answer that has a value', async () => {
    await createAnswer({ code: CODE_A, body: 'a real answer', startTime: '2024-01-01 09:00:00' });
    await createAnswer({ code: CODE_A, body: '', startTime: '2024-05-01 09:00:00' });
    await createAnswer({ code: CODE_A, body: null, startTime: '2024-06-01 09:00:00' });

    expect(
      await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(patientId, ALL_CODES),
    ).toEqual({ [CODE_A]: 'a real answer' });
  });

  it('ignores soft-deleted answers', async () => {
    await createAnswer({ code: CODE_A, body: 'kept answer', startTime: '2024-01-01 09:00:00' });
    const deletedAnswer = await createAnswer({
      code: CODE_A,
      body: 'deleted answer',
      startTime: '2024-06-01 09:00:00',
    });
    await Database.models.SurveyResponseAnswer.softRemove(deletedAnswer);

    expect(
      await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(patientId, ALL_CODES),
    ).toEqual({ [CODE_A]: 'kept answer' });
  });

  it('only considers answers belonging to the requested patient', async () => {
    await createAnswer({ code: CODE_A, body: 'this patient', startTime: '2024-01-01 09:00:00' });
    await createAnswer({
      code: CODE_A,
      body: 'other patient',
      startTime: '2024-06-01 09:00:00',
      encounter: otherEncounterId,
    });

    expect(
      await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(patientId, ALL_CODES),
    ).toEqual({ [CODE_A]: 'this patient' });
    expect(
      await SurveyResponseAnswer.getLastAnswerValuesByQuestionCodes(otherPatientId, ALL_CODES),
    ).toEqual({ [CODE_A]: 'other patient' });
  });
});
