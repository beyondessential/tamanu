import express from 'express';
import asyncHandler from 'express-async-handler';
import { getFilteredListByPermission } from '@tamanu/shared/utils/getFilteredListByPermission';
import { NotFoundError } from '@tamanu/shared/errors';
import {
  findRouteObject,
  permissionCheckingRouter,
  getResourceList,
} from '@tamanu/shared/utils/crudHelpers';

export const survey = express.Router();

// There should only be one survey with surveyType vitals, fetch it
// Needs to be added before the /:id endpoint so that endpoint doesn't catch it instead
survey.get(
  '/vitals',
  asyncHandler(async (req, res) => {
    const { models } = req;

    req.checkPermission('read', 'Vitals');
    const surveyRecord = await models.Survey.findOne({
      where: { surveyType: 'vitals' },
    });
    if (!surveyRecord) throw new NotFoundError();
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(surveyRecord.id, {
      includeAllVitals: true,
    });
    res.send({
      ...surveyRecord.forResponse(),
      components,
    });
  }),
);
survey.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const surveyRecord = await findRouteObject(req, 'Survey');
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(params.id, {
      includeAllVitals: true,
    });
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

surveyRelations.get(
  '/:id/surveyResponses',
  asyncHandler(async (req, res) => {
    const { id: surveyId, } = req.params;
    const survey = await req.models.Survey.findByPk(surveyId);

    req.checkPermission('read', survey);

    const response = await getResourceList(
      req,
      'SurveyResponse',
      'surveyId',
    );

    res.send(response);
  }),
);

survey.use(surveyRelations);
