import express from 'express';
import asyncHandler from 'express-async-handler';
import { getFilteredListByPermission } from 'shared/utils/getFilteredListByPermission';
import { findRouteObject, permissionCheckingRouter, simpleGetList } from './crudHelpers';

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
survey.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, ability } = req;
    req.checkPermission('list', 'Survey');
    const surveys = await models.Survey.findAll({
      where: { surveyType: req.query.type },
    });
    const filteredSurveys = getFilteredListByPermission(ability, surveys, 'submit');

    res.send({ surveys: filteredSurveys });
  }),
);

const surveyRelations = permissionCheckingRouter('list', 'SurveyResponse');
surveyRelations.get('/:id/surveyResponses', simpleGetList('SurveyResponse', 'surveyId'));
survey.use(surveyRelations);
