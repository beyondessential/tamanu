import express from 'express';
import asyncHandler from 'express-async-handler';

import { findRouteObject, permissionCheckingRouter, simpleGetList } from './crudHelpers';

export const survey = express.Router();

survey.get(
  '/referrals',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('list', 'Survey');
    const referrals = await models.Survey.getAllReferrals();

    res.send({ referrals });
  }),
);
survey.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const surveyRecord = await findRouteObject(req, 'Survey');
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(params.id);
    res.send({
      ...surveyRecord.forResponse(),
      components,
    });
  }),
);

const surveyRelations = permissionCheckingRouter('list', 'SurveyResponse');
surveyRelations.get('/:id/surveyResponses', simpleGetList('SurveyResponse', 'surveyId'));
survey.use(surveyRelations);
