import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import {
  SURVEY_TYPES,
  SYNDROMIC_SURVEILLANCE_SURVEY_ID,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { createSurveyResponseWithoutPermissionCheck } from './surveyResponse';

/**
 * Syndromic surveillance for an encounter, recorded as its one response to the deployment's
 * syndromic surveillance form.
 *
 * A response is submitted only through these routes. Once it exists, it is viewed and edited
 * through the standard survey response endpoints, under the standard form permissions.
 */

// spec: SYND#the-syndromic-surveillance-form
const findAvailableSyndromicSurveillanceSurvey = models =>
  models.Survey.findOne({
    where: {
      id: SYNDROMIC_SURVEILLANCE_SURVEY_ID,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      surveyType: { [Op.ne]: SURVEY_TYPES.OBSOLETE },
    },
  });

const findAvailableSyndromicSurveillanceSurveyOrThrow = async models => {
  const survey = await findAvailableSyndromicSurveillanceSurvey(models);
  if (!survey) throw new NotFoundError('Syndromic surveillance form not found');
  return survey;
};

const findSyndromicSurveillanceResponse = (models, encounterId) =>
  models.SurveyResponse.findOne({
    attributes: ['id'],
    where: { encounterId, surveyId: SYNDROMIC_SURVEILLANCE_SURVEY_ID },
    // An encounter only ever takes one response, so this just keeps the choice stable should a
    // second one arrive through sync.
    order: [['createdAt', 'ASC']],
  });

// spec: SYND#completion
const recordSyndromicSurveillanceResponse = (req, encounter, survey) => {
  const { db, models, body } = req;
  return db.transaction(async () => {
    // Locking the encounter serialises submissions for it, so two arriving at once cannot both
    // find it without a response and each record one.
    await models.Encounter.findByPk(encounter.id, { attributes: ['id'], lock: true });
    if (await findSyndromicSurveillanceResponse(models, encounter.id)) {
      throw new InvalidOperationError(
        'Syndromic surveillance has already been recorded for this encounter.',
      );
    }

    // Picked rather than spread from the body: the encounter and the form are what the route is
    // authorised for, so the request cannot point the response at anything else.
    return createSurveyResponseWithoutPermissionCheck(req, {
      surveyId: survey.id,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      facilityId: body.facilityId,
      startTime: body.startTime,
      endTime: body.endTime,
      answers: body.answers,
    });
  });
};

// spec: SYND#permissions
// Completing syndromic surveillance within the discharge form is covered by the permission to
// discharge the encounter, so these are the same checks as discharging, not the form's own.
const loadEncounterForDischarge = async req => {
  const { models, params } = req;
  req.checkPermission('read', 'Encounter');
  const encounter = await models.Encounter.findByPk(params.id);
  if (!encounter) throw new NotFoundError();
  req.checkPermission('write', encounter);
  req.checkPermission('write', 'Discharge');
  return encounter;
};

/**
 * Whether syndromic surveillance is available, and the encounter's response to the form if it has
 * one.
 *
 * Both the diagnosis pane and the discharge form read this, and it reveals only that a response
 * exists, never its answers, so it is gated on reading the encounter alone.
 *
 * spec: SYND#completion
 */
export const getEncounterSyndromicSurveillance = asyncHandler(async (req, res) => {
  const { models, params } = req;
  req.checkPermission('read', 'Encounter');
  const encounter = await models.Encounter.findByPk(params.id);
  if (!encounter) throw new NotFoundError();

  const survey = await findAvailableSyndromicSurveillanceSurvey(models);
  const surveyResponse = survey && (await findSyndromicSurveillanceResponse(models, encounter.id));

  res.send({
    isAvailable: Boolean(survey),
    surveyResponseId: surveyResponse?.id ?? null,
  });
});

/**
 * Submits the encounter's response from the diagnosis pane, under the standard permissions for
 * submitting a form.
 *
 * spec: SYND#diagnosis-pane
 * spec: SYND#permissions
 */
export const submitEncounterSyndromicSurveillance = asyncHandler(async (req, res) => {
  const { models, params } = req;
  req.checkPermission('create', 'SurveyResponse');
  const encounter = await models.Encounter.findByPk(params.id);
  if (!encounter) throw new NotFoundError();

  const survey = await findAvailableSyndromicSurveillanceSurveyOrThrow(models);
  req.checkPermission('submit', survey);

  res.send(await recordSyndromicSurveillanceResponse(req, encounter, survey));
});

export const getDischargeSyndromicSurveillanceSurvey = asyncHandler(async (req, res) => {
  const { models } = req;
  await loadEncounterForDischarge(req);

  const survey = await findAvailableSyndromicSurveillanceSurveyOrThrow(models);
  const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
  res.send({ ...survey.forResponse(), components });
});

// spec: SYND#discharge-form
export const submitDischargeSyndromicSurveillance = asyncHandler(async (req, res) => {
  const { models } = req;
  const encounter = await loadEncounterForDischarge(req);

  const survey = await findAvailableSyndromicSurveillanceSurveyOrThrow(models);
  res.send(await recordSyndromicSurveillanceResponse(req, encounter, survey));
});
