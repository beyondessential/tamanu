import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';

import { createTestContext } from '../../utilities';
import { buildPatchBody, createSurveyResponseTestHelpers } from './helpers';

describe('SurveyResponse PATCH /:id', () => {
  let app;
  let baseApp;
  let models;
  let ctx;
  let setupAutocompleteSurvey;
  let setupComplexChartSurvey;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    ({ setupAutocompleteSurvey, setupComplexChartSurvey } = createSurveyResponseTestHelpers(models));
  });
  afterAll(() => ctx.close());

  describe('program survey PATCH validation', () => {
    it('should reject PATCH when facilityId is missing', async () => {
      const { answer, response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const result = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({ answers: { [answer.dataElementId]: 'x' } });
  
      expect(result).toHaveStatus(422);
      expect(result.body.error.message).toBe('facilityId is required');
    });
  
    it('should reject PATCH when answers is missing, null, or not an object', async () => {
      const { facilityId, response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const missing = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(buildPatchBody({ facilityId }));
      expect(missing).toHaveStatus(422);
      expect(missing.body.error.message).toBe('answers is required');
  
      const nullAnswers = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(buildPatchBody({ facilityId, answers: null }));
      expect(nullAnswers).toHaveStatus(422);
      expect(nullAnswers.body.error.message).toBe('answers is required');
  
      const stringAnswers = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(buildPatchBody({ facilityId, answers: 'not-an-object' }));
      expect(stringAnswers).toHaveStatus(422);
      expect(stringAnswers.body.error.message).toBe('answers is required');
    });
  
    it('should reject PATCH when editedTime is missing or invalid', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const missing = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(
          buildPatchBody({
            answers: { [answer.dataElementId]: 'x' },
            editedTime: undefined,
            facilityId,
          }),
        );
      expect(missing).toHaveStatus(422);
      expect(missing.body.error.message).toBe('editedTime is required');
  
      const invalid = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({
          answers: { [answer.dataElementId]: 'x' },
          editedTime: 'not-a-datetime',
          facilityId,
        });
      expect(invalid).toHaveStatus(422);
      expect(invalid.body.error.message).toBe('editedTime is invalid');
    });
  
    it('should reject PATCH for a non-program survey', async () => {
      const { response, answer, facilityId } = await setupComplexChartSurvey();
  
      const result = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: 'patched' },
        }),
      );
  
      expect(result).toHaveStatus(422);
      expect(result.body.error.message).toBe('Cannot edit survey responses');
    });
  });
  
  describe('program survey PATCH authorisation', () => {
    disableHardcodedPermissionsForSuite();
  
    it('should reject unauthenticated PATCH', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const result = await baseApp
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(
          buildPatchBody({
            facilityId,
            answers: { [answer.dataElementId]: 'x' },
          }),
        );
  
      expect(result).toHaveRequestError();
    });
  
    it('should forbid PATCH when the role can read SurveyResponse but not write the survey', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const restrictedApp = await baseApp.asNewRole([
        ['read', 'SurveyResponse'],
        ['read', 'Survey', response.surveyId],
      ]);
  
      const result = await restrictedApp
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(
          buildPatchBody({
            facilityId,
            answers: { [answer.dataElementId]: 'x' },
          }),
        );
  
      expect(result).toBeForbidden();
    });
  
    it('should allow PATCH when the role can read SurveyResponse and write the survey', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
  
      const permittedApp = await baseApp.asNewRole([
        ['read', 'SurveyResponse'],
        ['write', 'Survey', response.surveyId],
      ]);
  
      const result = await permittedApp
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(
          buildPatchBody({
            facilityId,
            answers: { [answer.dataElementId]: 'patched-by-permitted-role' },
          }),
        );
  
      expect(result).toHaveSucceeded();
      await answer.reload();
      expect(answer.body).toBe('patched-by-permitted-role');
    });
  });
  
  describe('programResponses list isEdited after PATCH', () => {
    it('should set isEdited on encounter and patient programResponses lists after PATCH', async () => {
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        facility.id,
      );
      const encounter = await models.Encounter.findByPk(response.encounterId);
      expect(encounter).toBeTruthy();
  
      const encounterListBefore = await app.get(
        `/api/encounter/${encodeURIComponent(encounter.id)}/programResponses?rowsPerPage=100`,
      );
      expect(encounterListBefore).toHaveSucceeded();
      const encounterRowBefore = encounterListBefore.body.data.find(r => r.id === response.id);
      expect(encounterRowBefore).not.toBeUndefined();
      expect(encounterRowBefore.isEdited).toBeFalsy();
  
      const patientListBefore = await app.get(
        `/api/patient/${encodeURIComponent(encounter.patientId)}/programResponses?rowsPerPage=100`,
      );
      expect(patientListBefore).toHaveSucceeded();
      const patientRowBefore = patientListBefore.body.data.find(r => r.id === response.id);
      expect(patientRowBefore).not.toBeUndefined();
      expect(patientRowBefore.isEdited).toBeFalsy();
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: 'patched-for-isEdited-test' },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const encounterListAfter = await app.get(
        `/api/encounter/${encodeURIComponent(encounter.id)}/programResponses?rowsPerPage=100`,
      );
      expect(encounterListAfter).toHaveSucceeded();
      const encounterRowAfter = encounterListAfter.body.data.find(r => r.id === response.id);
      expect(encounterRowAfter).not.toBeUndefined();
      expect(encounterRowAfter.isEdited).toBe(true);
  
      const patientListAfter = await app.get(
        `/api/patient/${encodeURIComponent(encounter.patientId)}/programResponses?rowsPerPage=100`,
      );
      expect(patientListAfter).toHaveSucceeded();
      const patientRowAfter = patientListAfter.body.data.find(r => r.id === response.id);
      expect(patientRowAfter).not.toBeUndefined();
      expect(patientRowAfter.isEdited).toBe(true);
    });
  
    it('should not mark a response as edited when PATCH does not change any values', async () => {
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        facility.id,
      );
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: facility.id },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
    });
  });
  
  describe('program survey PATCH CalculatedQuestion answers', () => {
    const INPUT_CODE = 'PATCH_CALC_INPUT';
    const CALC_CODE = 'PATCH_CALC_CALC';
  
    const setupProgramSurveyWithCalculated = async ({ inputBody, calculatedBody } = {}) => {
      const {
        Facility,
        Location,
        Department,
        Patient,
        User,
        Encounter,
        Program,
        Survey,
        SurveyResponse,
        ProgramDataElement,
        SurveyScreenComponent,
        SurveyResponseAnswer,
      } = models;
  
      const facility = await Facility.create(fake(Facility));
      const location = await Location.create({
        ...fake(Location),
        facilityId: facility.id,
      });
      const department = await Department.create({
        ...fake(Department),
        facilityId: facility.id,
      });
      const examiner = await User.create(fake(User));
      const patient = await Patient.create(fake(Patient));
      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      });
      const program = await Program.create(fake(Program));
      const survey = await Survey.create({
        ...fake(Survey),
        programId: program.id,
        surveyType: SURVEY_TYPES.PROGRAMS,
      });
      const response = await SurveyResponse.create({
        ...fake(SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
  
      const inputElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
        code: INPUT_CODE,
      });
      const calculatedElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.CALCULATED,
        code: CALC_CODE,
      });
  
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        screenIndex: 0,
        componentIndex: 0,
        dataElementId: inputElement.id,
        surveyId: survey.id,
        calculation: '',
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        screenIndex: 0,
        componentIndex: 1,
        dataElementId: calculatedElement.id,
        surveyId: survey.id,
        calculation: `${INPUT_CODE} * 2`,
      });
  
      if (inputBody !== undefined) {
        await SurveyResponseAnswer.create({
          ...fake(SurveyResponseAnswer),
          dataElementId: inputElement.id,
          responseId: response.id,
          body: String(inputBody),
        });
      }
      if (calculatedBody !== undefined) {
        await SurveyResponseAnswer.create({
          ...fake(SurveyResponseAnswer),
          dataElementId: calculatedElement.id,
          responseId: response.id,
          body: calculatedBody,
        });
      }
  
      return {
        facilityId: facility.id,
        response,
        inputElement,
        calculatedElement,
      };
    };
  
    const getCalculatedAnswer = async (responseId, calculatedElementId) =>
      models.SurveyResponseAnswer.findOne({
        where: { responseId, dataElementId: calculatedElementId },
      });
  
    it('should not mark a response as edited when an empty calculated answer stays empty', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated();
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: null,
            [calculatedElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer).toBeFalsy();
    });
  
    it('should not mark a response as edited when calculated answer is unchanged (including 0)', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated({ inputBody: 0, calculatedBody: '0.0' });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: 0,
            [calculatedElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer?.body).toBe('0.0');
      expect(calculatedAnswer?.editedTime).toBeFalsy();
    });
  
    it('should mark a response as edited when a calculated answer changes from one value to another', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated({ inputBody: 5, calculatedBody: '10.0' });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: 10 },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer?.body).toBe('20.0');
      expect(calculatedAnswer?.editedTime).toBeTruthy();
    });
  
    it('should mark a response as edited when a calculated answer changes from a value to empty', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated({ inputBody: 5, calculatedBody: '10.0' });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: null },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer?.body).toBe('');
      expect(calculatedAnswer?.editedTime).toBeTruthy();
    });
  
    it('should mark a response as edited when a calculated answer changes from empty to a value', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated();
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: 3 },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer?.body).toBe('6.0');
      expect(calculatedAnswer?.editedTime).toBeTruthy();
    });
  
    it('should treat null and empty string stored bodies as equivalent when recalculating to empty', async () => {
      const { facilityId, response, inputElement, calculatedElement } =
        await setupProgramSurveyWithCalculated({ calculatedBody: '' });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: null,
            [calculatedElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
  
      const calculatedAnswer = await getCalculatedAnswer(response.id, calculatedElement.id);
      expect(calculatedAnswer?.body).toBe('');
      expect(calculatedAnswer?.editedTime).toBeFalsy();
    });
  });
  
  describe('program survey PATCH Result answers', () => {
    const INPUT_CODE = 'PATCH_RESULT_INPUT';
    const CALC_CODE = 'PATCH_RESULT_CALC';
    const RESULT_CODE = 'PATCH_RESULT_RESULT';
  
    const setupProgramSurveyWithResult = async ({ inputBody, calculatedBody, resultBody } = {}) => {
      const {
        Facility,
        Location,
        Department,
        Patient,
        User,
        Encounter,
        Program,
        Survey,
        SurveyResponse,
        ProgramDataElement,
        SurveyScreenComponent,
        SurveyResponseAnswer,
      } = models;
  
      const facility = await Facility.create(fake(Facility));
      const location = await Location.create({
        ...fake(Location),
        facilityId: facility.id,
      });
      const department = await Department.create({
        ...fake(Department),
        facilityId: facility.id,
      });
      const examiner = await User.create(fake(User));
      const patient = await Patient.create(fake(Patient));
      const encounter = await Encounter.create({
        ...fake(Encounter),
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      });
      const program = await Program.create(fake(Program));
      const survey = await Survey.create({
        ...fake(Survey),
        programId: program.id,
        surveyType: SURVEY_TYPES.PROGRAMS,
      });
      const response = await SurveyResponse.create({
        ...fake(SurveyResponse),
        surveyId: survey.id,
        encounterId: encounter.id,
      });
  
      const inputElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.NUMBER,
        code: INPUT_CODE,
      });
      const calculatedElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.CALCULATED,
        code: CALC_CODE,
      });
      const resultElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.RESULT,
        code: RESULT_CODE,
      });
  
      // runCalculations runs in component order; the result formula depends on the calculated value.
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        screenIndex: 0,
        componentIndex: 0,
        dataElementId: inputElement.id,
        surveyId: survey.id,
        calculation: '',
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        screenIndex: 0,
        componentIndex: 1,
        dataElementId: calculatedElement.id,
        surveyId: survey.id,
        calculation: `${INPUT_CODE} * 2`,
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        screenIndex: 0,
        componentIndex: 2,
        dataElementId: resultElement.id,
        surveyId: survey.id,
        calculation: CALC_CODE,
      });
  
      if (inputBody !== undefined) {
        await SurveyResponseAnswer.create({
          ...fake(SurveyResponseAnswer),
          dataElementId: inputElement.id,
          responseId: response.id,
          body: String(inputBody),
        });
      }
      if (calculatedBody !== undefined) {
        await SurveyResponseAnswer.create({
          ...fake(SurveyResponseAnswer),
          dataElementId: calculatedElement.id,
          responseId: response.id,
          body: calculatedBody,
        });
      }
      if (resultBody !== undefined) {
        await SurveyResponseAnswer.create({
          ...fake(SurveyResponseAnswer),
          dataElementId: resultElement.id,
          responseId: response.id,
          body: resultBody,
        });
      }
  
      return {
        facilityId: facility.id,
        response,
        inputElement,
        calculatedElement,
        resultElement,
      };
    };
  
    const getResultAnswer = async (responseId, resultElementId) =>
      models.SurveyResponseAnswer.findOne({
        where: { responseId, dataElementId: resultElementId },
      });
  
    it('should not mark a response as edited when an empty result answer stays empty', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult();
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: null,
            [resultElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer).toBeFalsy();
    });
  
    it('should not mark a response as edited when result answer is unchanged (including 0)', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult({
          inputBody: 0,
          calculatedBody: '0.0',
          resultBody: '0',
        });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: 0,
            [resultElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer?.body).toBe('0');
      expect(resultAnswer?.editedTime).toBeFalsy();
    });
  
    it('should mark a response as edited when a result answer changes from one value to another', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult({
          inputBody: 5,
          calculatedBody: '10.0',
          resultBody: '10',
        });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: 10 },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer?.body).toBe('20');
      expect(resultAnswer?.editedTime).toBeTruthy();
    });
  
    it('should mark a response as edited when a result answer changes from a value to empty', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult({
          inputBody: 5,
          calculatedBody: '10.0',
          resultBody: '10',
        });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: null },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer?.body).toBe('');
      expect(resultAnswer?.editedTime).toBeTruthy();
    });
  
    it('should mark a response as edited when a result answer changes from empty to a value', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult();
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [inputElement.id]: 3 },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeTruthy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer?.body).toBe('6');
      expect(resultAnswer?.editedTime).toBeTruthy();
    });
  
    it('should treat null and empty string stored result bodies as equivalent when recalculating to empty', async () => {
      const { facilityId, response, inputElement, resultElement } =
        await setupProgramSurveyWithResult({
          resultBody: '',
        });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: {
            [inputElement.id]: null,
            [resultElement.id]: null,
          },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.editedTime).toBeFalsy();
  
      const resultAnswer = await getResultAnswer(response.id, resultElement.id);
      expect(resultAnswer?.body).toBe('');
      expect(resultAnswer?.editedTime).toBeFalsy();
    });
  });
  
  describe('program survey PATCH notification re-queue', () => {
    it('should set `notified` to false when a completed notifiable response is edited', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
      const survey = await models.Survey.findByPk(response.surveyId);
      await survey.update({
        notifiable: true,
        notifyEmailAddresses: ['notify@example.com'],
      });
      await response.update({ notified: true });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: 'patched-for-notification-requeue' },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.notified).toBe(false);
    });
  
    it('should not change `notified` when the survey is not `notifiable`', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
      const survey = await models.Survey.findByPk(response.surveyId);
      await survey.update({ notifiable: false });
      await response.update({ notified: true });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: 'patched-non-notifiable' },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.notified).toBe(true);
    });
  
    it('should not re-queue notification when PATCH makes no changes', async () => {
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );
      const survey = await models.Survey.findByPk(response.surveyId);
      await survey.update({
        notifiable: true,
        notifyEmailAddresses: ['notify@example.com'],
      });
      await response.update({ notified: true });
  
      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [answer.dataElementId]: answer.body },
        }),
      );
      expect(patch).toHaveSucceeded();
  
      await response.reload();
      expect(response.notified).toBe(true);
    });
  });
});
