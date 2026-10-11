import { subject } from '@casl/ability';
import asyncHandler from 'express-async-handler';

import { SYNDROMIC_SURVEILLANCE_SURVEY_ID } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';

export async function createSurveyResponse(req) {
  const { models, body } = req;

  // Responses for the vitals survey will check against 'Vitals' create permissions
  // All others will check against 'SurveyResponse' create permissions
  const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
  if (noun === 'Charting') {
    req.checkPermission('create', subject('Charting', { id: body.surveyId }));
  } else {
    req.checkPermission('create', noun);
  }

  // spec: SYND#the-syndromic-surveillance-form
  // Syndromic surveillance is submitted only through its encounter, which holds it to one response.
  if (body.surveyId === SYNDROMIC_SURVEILLANCE_SURVEY_ID) {
    throw new InvalidOperationError(
      'Syndromic surveillance can only be submitted from the encounter it is for.',
    );
  }

  return await createSurveyResponseWithoutPermissionCheck(req, req.body);
}

/**
 * For routes that authorise the submission some other way than the permission to create the
 * survey response, e.g. syndromic surveillance completed while discharging an encounter.
 */
export async function createSurveyResponseWithoutPermissionCheck(req, { facilityId, ...body }) {
  const { models, settings } = req;

  const getDefaultId = async type =>
    models.SurveyResponseAnswer.getDefaultId(type, settings[facilityId]);
  const updatedBody = {
    locationId: body.locationId || (await getDefaultId('location')),
    departmentId: body.departmentId || (await getDefaultId('department')),
    userId: req.user.id,
    facilityId,
    ...body,
  };
  return await models.SurveyResponse.createWithAnswers(updatedBody);
}

export const surveyResponsePostHandler = asyncHandler(async (req, res) => {
  const responseRecord = await req.db.transaction(async () => {
    return await createSurveyResponse(req);
  });
  res.send(responseRecord);
});
