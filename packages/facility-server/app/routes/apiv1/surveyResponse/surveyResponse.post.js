import { subject } from '@casl/ability';
import asyncHandler from 'express-async-handler';

export async function createSurveyResponse(req) {
  const {
    models,
    body: { facilityId, ...body },
    settings,
  } = req;

  // Responses for the vitals survey will check against 'Vitals' create permissions
  // All others will check against 'SurveyResponse' create permissions
  const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
  if (noun === 'Charting') {
    req.checkPermission('create', subject('Charting', { id: body.surveyId }));
  } else {
    req.checkPermission('create', noun);
  }

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
