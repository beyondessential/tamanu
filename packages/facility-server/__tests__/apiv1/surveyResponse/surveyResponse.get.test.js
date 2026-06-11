import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake } from '@tamanu/fake-data/fake';
import { compressSignatureBody } from '@tamanu/shared/utils/signature';

import { createTestContext } from '../../utilities';
import {
  createSurveyResponseTestHelpers,
  SIGNATURE_ANSWER_BODY,
} from './helpers';

describe('SurveyResponse GET /:id', () => {
  let app;
  let baseApp;
  let models;
  let ctx;
  let setupAutocompleteSurvey;
  let setupSignatureSurvey;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    ({ setupAutocompleteSurvey, setupSignatureSurvey } = createSurveyResponseTestHelpers(models));
  });
  afterAll(() => ctx.close());

  it('should include surveyName from the associated survey', async () => {
    const { Facility, Survey } = models;
    const facility = await Facility.create(fake(Facility));
    const { response } = await setupAutocompleteSurvey(
      JSON.stringify({ source: 'Facility' }),
      facility.id,
    );
    const [survey, result] = await Promise.all([
      Survey.findByPk(response.surveyId, { attributes: ['name'] }),
      app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`),
    ]);

    expect(result).toHaveSucceeded();
    expect(result.body.surveyName).toEqual(survey.name);
  });

  describe('signature', () => {
    it('should decompress a stored signature answer for the API response', async () => {
      const compressedBody = await compressSignatureBody(SIGNATURE_ANSWER_BODY);
      const { answer, response } = await setupSignatureSurvey(compressedBody);

      const result = await app.get(`/api/surveyResponse/${encodeURIComponent(response.id)}`);

      expect(result).toHaveSucceeded();
      expect(result.body.answers).toHaveLength(1);
      expect(result.body.answers[0]).toMatchObject({
        id: answer.id,
        body: SIGNATURE_ANSWER_BODY,
        originalBody: SIGNATURE_ANSWER_BODY,
      });
      expect(result.body.answers[0].body).not.toBe(compressedBody);
      expect(result.body.answers[0].originalBody).not.toBe(compressedBody);
    });
  });

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
