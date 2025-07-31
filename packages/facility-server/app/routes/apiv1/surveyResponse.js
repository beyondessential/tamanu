import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';

import { transformAnswers } from '@tamanu/shared/reports/utilities/transformAnswers';

export const surveyResponse = express.Router();

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
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

    await req.audit.access({
      recordId: surveyResponseRecord.id,
      params,
      model: models.SurveyResponse,
      facilityId: query.facilityId,
    });

    res.send({
      ...surveyResponseRecord.forResponse(),
      components,
      answers: answers.map((answer) => {
        const transformedAnswer = transformedAnswers.find((a) => a.id === answer.id);
        return {
          ...answer.dataValues,
          originalBody: answer.body,
          body: transformedAnswer?.body,
          sourceType: transformedAnswer?.sourceType,
        };
      }),
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
    // All others will check against 'SurveyResponse' create permissions
    const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
    if (noun === 'Charting') {
      req.checkPermission('create', subject('Charting', { id: body.surveyId }));
    } else {
      req.checkPermission('create', noun);
    }

    const getDefaultId = async (type) =>
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
