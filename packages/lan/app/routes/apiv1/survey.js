import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import moment from 'moment';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

export const survey = express.Router();

survey.get('/:id', asyncHandler(async (req, res) => {
  const { models, params } = req;

  const survey = await req.findRouteObject('Survey');
  const components = await models.SurveyScreenComponent.getComponentsForSurvey(params.id);
  res.send({
    ...survey.forResponse(),
    components,
  });
}));

