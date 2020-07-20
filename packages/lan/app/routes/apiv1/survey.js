import express from 'express';
import asyncHandler from 'express-async-handler';

import { findRouteObject } from './crudHelpers';

export const survey = express.Router();

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
