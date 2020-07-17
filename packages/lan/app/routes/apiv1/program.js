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

import { renameObjectKeys } from '~/utils/renameObjectKeys';

export const program = express.Router();

program.get('/:id', simpleGet('Program'));
program.put('/:id', simplePut('Program'));
program.post('/$', simplePost('Program'));

const programRelations = permissionCheckingRouter('read', 'Program');
programRelations.get('/:id/surveys', simpleGetList('Survey', 'programId'));
program.use(programRelations);

const survey = express.Router();

survey.get('/:id', asyncHandler(async (req, res) => {
  const { models, params } = req;

  const survey = await req.findRouteObject('Survey');
  const components = models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
  res.send({
    ...survey,
    components,
  });
}));

