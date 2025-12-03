import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, literal } from 'sequelize';

import { SURVEY_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { getFilteredListByPermission } from '@tamanu/shared/utils/getFilteredListByPermission';
import { NotFoundError } from '@tamanu/errors';
import {
  findRouteObject,
  permissionCheckingRouter,
  getResourceList,
} from '@tamanu/shared/utils/crudHelpers';
import { subject } from '@casl/ability';

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
  '/charts',
  asyncHandler(async (req, res) => {
    const encounterId = req.query?.encounterId;

    if (encounterId) {
      const encounter = await req.models.Encounter.findByPk(encounterId);
        if (!encounter) {
          throw new NotFoundError('Encounter not found');
        }
    }

    req.flagPermissionChecked();
    const {
      models: { Survey },
    } = req;

    const chartSurveys = await Survey.findAll({
      where: {
        [Op.or]: [
          // Get all current simple and complex charts
          {
            surveyType: {
              [Op.in]: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART],
            },
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          },
          // Get all historical simple and complex charts with answers
          {
            [Op.and]: [
              {
                surveyType: {
                  [Op.in]: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART],
                },
                visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
              },
              literal(
                `
                  EXISTS (
                  SELECT 1 FROM survey_responses sr
                  JOIN survey_response_answers sra ON sra.response_id = sr.id
                  WHERE sr.survey_id = "Survey".id 
                    ${encounterId ? `AND sr.encounter_id = :encounterId` : ''}
                    AND sr.deleted_at IS NULL
                  )
                `,
              ),
            ],
          },
          // Get all complex core charts regardless of visibility status
          {
            surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
          },
        ],
      },
      order: [['name', 'ASC']],
      ...(encounterId && { replacements: { encounterId } }),
    });
    const permittedChartSurveys = chartSurveys.filter((survey) =>
      req.ability.can('list', subject('Charting', { id: survey.id })),
    );

    res.send(permittedChartSurveys);
  }),
);

survey.get(
  '/procedureType/:procedureTypeId',
  asyncHandler(async (req, res) => {
    const { models, ability, params } = req;
    const { procedureTypeId } = params;
    const { ProcedureTypeSurvey } = models;

    req.checkPermission('list', 'Survey');

    const procedureTypeSurveys = await ProcedureTypeSurvey.findAll({
      where: {
        procedureTypeId: procedureTypeId,
      },
      include: [
        {
          model: models.Survey,
          as: 'survey',
          where: {
            visibilityStatus: { [Op.ne]: VISIBILITY_STATUSES.HISTORICAL },
          },
        },
      ],
      order: [['survey', 'name', 'ASC']],
    });

    // Extract the surveys from the join results
    const surveys = procedureTypeSurveys.map(pts => pts.survey);
    const filteredSurveys = getFilteredListByPermission(ability, surveys, 'submit');

    res.send(filteredSurveys);
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
      where: {
        surveyType: req.query.type,
        visibilityStatus: { [Op.ne]: VISIBILITY_STATUSES.HISTORICAL },
      },
      order: [literal('LOWER(name) ASC')],
    });
    const filteredSurveys = getFilteredListByPermission(ability, surveys, 'submit');

    res.send({ surveys: filteredSurveys });
  }),
);

const surveyRelations = permissionCheckingRouter('list', 'SurveyResponse');

surveyRelations.get(
  '/:id/surveyResponses',
  asyncHandler(async (req, res) => {
    const { id: surveyId } = req.params;
    const survey = await req.models.Survey.findByPk(surveyId);

    req.checkPermission('read', survey);

    const response = await getResourceList(req, 'SurveyResponse', 'surveyId');

    res.send(response);
  }),
);

survey.use(surveyRelations);
