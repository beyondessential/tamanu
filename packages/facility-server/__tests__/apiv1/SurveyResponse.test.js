import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';

import { createTestContext } from '../utilities';

describe('SurveyResponse', () => {
  let app;
  let baseApp;
  let models;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

  const setupAutocompleteSurvey = async (sscConfig, answerBody) => {
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
    });
    const response = await SurveyResponse.create({
      ...fake(SurveyResponse),
      surveyId: survey.id,
      encounterId: encounter.id,
    });
    const dataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: 'Autocomplete',
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      responseId: response.id,
      dataElementId: dataElement.id,
      surveyId: survey.id,
      config: sscConfig,
    });
    const answer = await SurveyResponseAnswer.create({
      ...fake(SurveyResponseAnswer),
      dataElementId: dataElement.id,
      responseId: response.id,
      body: answerBody,
    });

    return { answer, response, facilityId: facility.id };
  };

  const setupAutocompleteSurveyWithoutAnswer = async sscConfig => {
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
    });
    const response = await SurveyResponse.create({
      ...fake(SurveyResponse),
      surveyId: survey.id,
      encounterId: encounter.id,
    });
    const dataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: 'Autocomplete',
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      responseId: response.id,
      dataElementId: dataElement.id,
      surveyId: survey.id,
      config: sscConfig,
    });

    return { dataElement, response, facilityId: facility.id };
  };

  const setupComplexChartSurvey = async () => {
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
      SurveyScreenComponent,
      ProgramDataElement,
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
      surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
      programId: program.id,
    });
    const response = await SurveyResponse.create({
      ...fake(SurveyResponse),
      surveyId: survey.id,
      encounterId: encounter.id,
    });
    const dataElement = await ProgramDataElement.create({
      ...fake(ProgramDataElement),
      type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
    });
    await SurveyScreenComponent.create({
      ...fake(SurveyScreenComponent),
      dataElementId: dataElement.id,
      surveyId: survey.id,
      calculation: '',
    });
    const answer = await SurveyResponseAnswer.create({
      ...fake(SurveyResponseAnswer),
      dataElementId: dataElement.id,
      responseId: response.id,
      body: 'Initial answer',
    });

    return { answer, response, dataElement, survey, facilityId: facility.id };
  };

  describe('autocomplete', () => {
    it("should look up an autocomplete component's source model and extract a name", async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { answer, response } = await setupAutocompleteSurvey(
        JSON.stringify({
          source: 'Facility',
        }),
        facility.id,
      );

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        answers: [
          {
            id: answer.id,
            originalBody: facility.id,
            body: facility.name,
          },
        ],
      });
    });

    // This test currently fails because some survey utils filter the missing-source config out before
    // it reaches the logic that would throw the "misconfigured" error. A question with a missing
    // source will be obviously broken anyway, so while this should be fixed eventually it doesn't
    // represent a risk to data or user experience, just a chance of inconveniencing a PM.
    it('should error if the config has no source', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey('{}', facility.id);

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: 'no model for componentConfig {}',
        },
      });
    });

    it("should error if the config doesn't point to a valid source", async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Frobnizzle' }),
        facility.id,
      );

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: 'no model for componentConfig {"source":"Frobnizzle"}',
        },
      });
    });

    it("should error if the answer body doesn't point to a real record", async () => {
      // arrange
      const { Facility } = models;
      await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        'this-facility-id-does-not-exist',
      );

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: `Selected answer Facility[this-facility-id-does-not-exist] not found`,
        },
      });
    });

    it('should error and hint if users might have legacy ReferenceData sources', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'ReferenceData', where: { type: 'facility' } }),
        facility.id,
      );

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).not.toHaveSucceeded();
      expect(result.body).toMatchObject({
        error: {
          message: `Selected answer ReferenceData[${facility.id}] not found (check that the surveyquestion's source isn't ReferenceData for a Location, Facility, or Department)`,
        },
      });
    });
  });

  describe('complexChartInstance', () => {
    it('should update existing answers', async () => {
      const { answer, response } = await setupComplexChartSurvey();
      const oldValue = answer.body;
      const newValue = 'Updated answer';

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            [answer.dataElementId]: newValue,
          },
        });
      await answer.reload();

      expect(result).toHaveSucceeded();
      expect(answer.body).toEqual(newValue);
      expect(answer.body).not.toEqual(oldValue);
    });

    it('should create new answers for data elements not previously answered', async () => {
      const { ProgramDataElement, SurveyScreenComponent } = models;
      const { response } = await setupComplexChartSurvey();
      const newDataElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        dataElementId: newDataElement.id,
        surveyId: response.surveyId,
        calculation: '',
      });
      const newValue = 'New answer value';

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            [newDataElement.id]: newValue,
          },
        });
      const newAnswer = await models.SurveyResponseAnswer.findOne({
        where: {
          responseId: response.id,
          dataElementId: newDataElement.id,
        },
      });

      expect(result).toHaveSucceeded();
      expect(newAnswer).toBeTruthy();
      expect(newAnswer.body).toEqual(newValue);
    });

    it('should ignore null values in answers', async () => {
      const { answer, response } = await setupComplexChartSurvey();
      const originalValue = answer.body;

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            [answer.dataElementId]: null,
          },
        });
      await answer.reload();

      expect(result).toHaveSucceeded();
      expect(answer.body).toEqual(originalValue);
    });

    it('should update multiple answers in a single request', async () => {
      const { ProgramDataElement, SurveyScreenComponent, SurveyResponseAnswer } = models;
      const { answer: answer1, response } = await setupComplexChartSurvey();
      const newDataElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        dataElementId: newDataElement.id,
        surveyId: response.surveyId,
        calculation: '',
      });
      const answer2 = await models.SurveyResponseAnswer.create({
        ...fake(SurveyResponseAnswer),
        dataElementId: newDataElement.id,
        responseId: response.id,
        body: 'Initial answer',
      });
      const oldValue1 = answer1.body;
      const oldValue2 = answer2.body;
      const newValue1 = 'New answer 1';
      const newValue2 = 'New answer 2';

      // Also create a missing answer
      const newAnswerDataElement = await ProgramDataElement.create({
        ...fake(ProgramDataElement),
        type: PROGRAM_DATA_ELEMENT_TYPES.TEXT,
      });
      await SurveyScreenComponent.create({
        ...fake(SurveyScreenComponent),
        dataElementId: newAnswerDataElement.id,
        surveyId: response.surveyId,
        calculation: '',
      });
      const newAnswerValue = 'New answer value';

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            [answer1.dataElementId]: newValue1,
            [answer2.dataElementId]: newValue2,
            [newAnswerDataElement.id]: newAnswerValue,
          },
        });
      await answer1.reload();
      await answer2.reload();

      expect(result).toHaveSucceeded();
      expect(answer1.body).toEqual(newValue1);
      expect(answer1.body).not.toEqual(oldValue1);
      expect(answer2.body).toEqual(newValue2);
      expect(answer2.body).not.toEqual(oldValue2);
    });

    it('should return 404 when survey response not found', async () => {
      const nonExistentId = 'non-existent-id';

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(nonExistentId)}`)
        .send({
          answers: {
            'some-data-element-id': 'some value',
          },
        });

      expect(result).not.toHaveSucceeded();
      expect(result.status).toBe(404);
    });

    it('should return error when survey type is not COMPLEX_CHART_CORE', async () => {
      const { survey, response } = await setupComplexChartSurvey();
      await survey.update({ surveyType: SURVEY_TYPES.PROGRAMS });

      const result = await app
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            'some-data-element-id': 'some value',
          },
        });

      expect(result).not.toHaveSucceeded();
      expect(result.status).toBe(422);
    });

    it('should require charting write permission', async () => {
      const { answer, response } = await setupComplexChartSurvey();
      const unauthorizedApp = await baseApp.asRole('reception');

      const result = await unauthorizedApp
        .put(`/api/surveyResponse/complexChartInstance/${encodeURIComponent(response.id)}`)
        .send({
          answers: {
            [answer.dataElementId]: 'some value',
          },
        });

      expect(result).toBeForbidden();
    });
  });

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
        .send({ facilityId });
      expect(missing).toHaveStatus(422);
      expect(missing.body.error.message).toBe('answers is required');

      const nullAnswers = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({ facilityId, answers: null });
      expect(nullAnswers).toHaveStatus(422);
      expect(nullAnswers.body.error.message).toBe('answers is required');

      const stringAnswers = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({ facilityId, answers: 'not-an-object' });
      expect(stringAnswers).toHaveStatus(422);
      expect(stringAnswers.body.error.message).toBe('answers is required');
    });

    it('should reject PATCH for a non-program survey', async () => {
      const { response, answer, facilityId } = await setupComplexChartSurvey();

      const result = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({
          facilityId,
          answers: { [answer.dataElementId]: 'patched' },
        });

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
        .send({
          facilityId,
          answers: { [answer.dataElementId]: 'x' },
        });

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
        .send({
          facilityId,
          answers: { [answer.dataElementId]: 'x' },
        });

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
        .send({
          facilityId,
          answers: { [answer.dataElementId]: 'patched-by-permitted-role' },
        });

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

      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send({
        facilityId,
        answers: { [answer.dataElementId]: 'patched-for-isEdited-test' },
      });
      expect(patch).toHaveSucceeded();

      await response.reload();
      expect(response.editedAt).toBeTruthy();

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

      const patch = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send({
        facilityId,
        answers: { [answer.dataElementId]: facility.id },
      });
      expect(patch).toHaveSucceeded();

      await response.reload();
      expect(response.editedAt).toBeFalsy();
    });
  });

  describe('survey response changelog authorisation', () => {
    disableHardcodedPermissionsForSuite();

    it('should reject unauthenticated GET /changes', async () => {
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );

      const result = await baseApp.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );

      expect(result).toHaveRequestError();
    });

    it('should forbid GET /changes when the role cannot read SurveyResponse', async () => {
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        (await models.Facility.create(fake(models.Facility))).id,
      );

      const noSurveyResponseRead = await baseApp.asNewRole([['read', 'Survey', response.surveyId]]);

      const result = await noSurveyResponseRead.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );

      expect(result).toBeForbidden();
    });

    it('should reject GET /changes for a non-program survey', async () => {
      const { response } = await setupComplexChartSurvey();

      const permittedApp = await baseApp.asNewRole([['read', 'SurveyResponse']]);

      const result = await permittedApp.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );

      expect(result).toHaveStatus(422);
      expect(result.body.error.message).toBe(
        'Changelog is only available for program survey responses',
      );
    });
  });

  describe('survey response changelog edit semantics', () => {
    it('should mark a newly answered question as edited when it was unanswered on first submit', async () => {
      const { Facility } = models;
      const selectedFacility = await Facility.create(fake(Facility));
      const { dataElement, response, facilityId } = await setupAutocompleteSurveyWithoutAnswer(
        JSON.stringify({ source: 'Facility' }),
      );
      const encounter = await models.Encounter.findByPk(response.encounterId);

      const encounterListBefore = await app.get(
        `/api/encounter/${encodeURIComponent(encounter.id)}/programResponses?rowsPerPage=100`,
      );
      expect(encounterListBefore).toHaveSucceeded();
      const encounterRowBefore = encounterListBefore.body.data.find(r => r.id === response.id);
      expect(encounterRowBefore).not.toBeUndefined();
      expect(encounterRowBefore.isEdited).toBeFalsy();

      const edit = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send({
        facilityId,
        answers: { [dataElement.id]: selectedFacility.id },
      });
      expect(edit).toHaveSucceeded();

      const createdAnswer = await models.SurveyResponseAnswer.findOne({
        where: {
          responseId: response.id,
          dataElementId: dataElement.id,
        },
      });
      expect(createdAnswer).toBeTruthy();
      expect(createdAnswer.body).toBe(selectedFacility.id);

      const encounterListAfter = await app.get(
        `/api/encounter/${encodeURIComponent(encounter.id)}/programResponses?rowsPerPage=100`,
      );
      expect(encounterListAfter).toHaveSucceeded();
      const encounterRowAfter = encounterListAfter.body.data.find(r => r.id === response.id);
      expect(encounterRowAfter).not.toBeUndefined();
      expect(encounterRowAfter.isEdited).toBe(true);

      const changelog = await app.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );
      expect(changelog).toHaveSucceeded();

      const answerChanges = changelog.body.changes.filter(
        c => c.tableName === 'survey_response_answers' && c.recordId === createdAnswer.id,
      );
      expect(answerChanges).toHaveLength(1);
      expect(answerChanges[0].fieldChanges).toEqual([
        {
          fieldKey: 'body',
          from: null,
          to: selectedFacility.id,
        },
      ]);
    });

    it('should still surface an answer as edited after editing it away from and back to the original value', async () => {
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const otherFacility = await Facility.create(fake(Facility));
      const { answer, response, facilityId } = await setupAutocompleteSurvey(
        JSON.stringify({ source: 'Facility' }),
        facility.id,
      );
      const originalBody = answer.body;
      expect(originalBody).toBe(facility.id);

      // Edit away from the original value
      const editAway = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({
          facilityId,
          answers: { [answer.dataElementId]: otherFacility.id },
        });
      expect(editAway).toHaveSucceeded();

      // Edit back to the original value
      const editBack = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send({
          facilityId,
          answers: { [answer.dataElementId]: originalBody },
        });
      expect(editBack).toHaveSucceeded();

      await answer.reload();
      expect(answer.body).toBe(originalBody);

      const changelog = await app.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );
      expect(changelog).toHaveSucceeded();

      const answerChanges = changelog.body.changes.filter(
        c => c.tableName === 'survey_response_answers' && c.recordId === answer.id,
      );
      expect(answerChanges).toHaveLength(2);
    });
  });

  describe('permissions', () => {
    disableHardcodedPermissionsForSuite();

    it('should not throw forbidden error when role has sufficient permission for a particular survey', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({
          source: 'Facility',
        }),
        facility.id,
      );

      const permissions = [
        ['read', 'SurveyResponse'],
        ['read', 'Survey', response.surveyId],
      ];

      app = await baseApp.asNewRole(permissions);

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).toHaveSucceeded();
    });

    it('should throw forbidden error when role does not sufficient permission for a particular survey', async () => {
      // arrange
      const { Facility } = models;
      const facility = await Facility.create(fake(Facility));
      const { response } = await setupAutocompleteSurvey(
        JSON.stringify({
          source: 'Facility',
        }),
        facility.id,
      );

      const permissions = [['read', 'SurveyResponse']];

      app = await baseApp.asNewRole(permissions);

      // act
      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      // assert
      expect(result).toHaveStatus(403);
    });
  });
});
