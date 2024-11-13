import express from 'express';
import asyncHandler from 'express-async-handler';

import { transformAnswers } from '@tamanu/shared/reports/utilities/transformAnswers';

export const surveyResponse = express.Router();

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    const survey = await surveyResponseRecord.getSurvey();

    req.checkPermission('read', survey);

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponseRecord.surveyId,
      { includeAllVitals: true },
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    const transformedAnswers = await transformAnswers(models, answers, components, {
      notTransformDate: true,
    });

    res.send({
      ...surveyResponseRecord.forResponse(),
      components,
      answers: answers.map(answer => ({
        ...answer.dataValues,
        originalBody: answer.body,
        body: transformedAnswers.find(a => a.id === answer.id)?.body,
      })),
    });
  }),
);

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models,
      body: { facilityId, ...body },
      db,
      settings,
    } = req;
    // Responses for the vitals survey will check against 'Vitals' create permissions
    // All others witll check against 'SurveyResponse' create permissions
    const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
    req.checkPermission('create', noun);

    const getDefaultId = async type =>
      models.SurveyResponseAnswer.getDefaultId(type, settings[facilityId]);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      userId: req.user.id,
      facilityId,
      ...body,
    };

    const responseRecord = await db.transaction(async () => {
      return models.SurveyResponse.createWithAnswers(updatedBody);
    });
    res.send(responseRecord);
  }),
);
