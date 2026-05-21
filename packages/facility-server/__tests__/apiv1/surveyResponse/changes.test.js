import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';

import { createTestContext } from '../../utilities';
import { buildPatchBody, createSurveyResponseTestHelpers } from './helpers';

describe('SurveyResponse GET /:id/changes', () => {
  let app;
  let baseApp;
  let models;
  let ctx;
  let setupAutocompleteSurvey;
  let setupAutocompleteSurveyWithoutAnswer;
  let setupComplexChartSurvey;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    ({ setupAutocompleteSurvey, setupAutocompleteSurveyWithoutAnswer, setupComplexChartSurvey } =
      createSurveyResponseTestHelpers(models));
  });
  afterAll(() => ctx.close());

  describe('authorisation', () => {
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

  describe('edit semantics', () => {
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

      const edit = await app.patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`).send(
        buildPatchBody({
          facilityId,
          answers: { [dataElement.id]: selectedFacility.id },
        }),
      );
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

      const answerChanges = changelog.body.filter(c => c.recordId === createdAnswer.id);
      expect(answerChanges).toHaveLength(1);
      expect(answerChanges[0]).toMatchObject({
        from: null,
        to: selectedFacility.id,
      });
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
        .send(
          buildPatchBody({
            facilityId,
            answers: { [answer.dataElementId]: otherFacility.id },
          }),
        );
      expect(editAway).toHaveSucceeded();

      // Edit back to the original value
      const editBack = await app
        .patch(`/api/surveyResponse/${encodeURIComponent(response.id)}`)
        .send(
          buildPatchBody({
            facilityId,
            answers: { [answer.dataElementId]: originalBody },
          }),
        );
      expect(editBack).toHaveSucceeded();

      await answer.reload();
      expect(answer.body).toBe(originalBody);

      const changelog = await app.get(
        `/api/surveyResponse/${encodeURIComponent(response.id)}/changes`,
      );
      expect(changelog).toHaveSucceeded();

      const answerChanges = changelog.body.filter(c => c.recordId === answer.id);
      expect(answerChanges).toHaveLength(2);
    });
  });
});
