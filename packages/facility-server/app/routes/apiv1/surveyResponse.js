import express from 'express';
import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';

import {
  getPatientDataFieldAssociationData,
  transformAnswers,
} from '@tamanu/shared/reports/utilities/transformAnswers';
import { PATIENT_DATA_FIELD_LOCATIONS, SURVEY_TYPES } from '@tamanu/constants';
import { InvalidOperationError, NotFoundError, InvalidParameterError } from '@tamanu/errors';

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
      frontEndContext: params,
      model: models.SurveyResponse,
      facilityId: query.facilityId,
    });

    res.send({
      ...surveyResponseRecord.forResponse(),
      components,
      answers: answers.map(answer => {
        const transformedAnswer = transformedAnswers.find(a => a.id === answer.id);
        return {
          ...answer.dataValues,
          originalBody: answer.body,
          body: transformedAnswer?.body,
          sourceType: transformedAnswer?.sourceType,
          sourceConfig: transformedAnswer?.sourceConfig,
        };
      }),
    });
  }),
);

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

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const responseRecord = await req.db.transaction(async () => {
      return await createSurveyResponse(req);
    });
    res.send(responseRecord);
  }),
);

surveyResponse.put(
  '/complexChartInstance/:id',
  asyncHandler(async (req, res) => {
    const { models, body, params, db } = req;

    const responseRecord = await models.SurveyResponse.findByPk(params.id);
    if (!responseRecord) {
      throw new NotFoundError('Response record not found');
    }

    req.checkPermission('write', subject('Charting', { id: responseRecord.surveyId }));

    const survey = await responseRecord.getSurvey();
    if (survey.surveyType !== SURVEY_TYPES.COMPLEX_CHART_CORE) {
      throw new InvalidOperationError('Cannot edit survey responses');
    }

    const components = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id);
    const responseAnswers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    await db.transaction(async () => {
      for (const [dataElementId, value] of Object.entries(body.answers)) {
        if (!components.some(c => c.dataElementId === dataElementId)) {
          throw new InvalidOperationError('Some components are missing from the survey');
        }

        // Ignore null values
        if (value === null) {
          continue;
        }

        const existingAnswer = responseAnswers.find(a => a.dataElementId === dataElementId);
        if (existingAnswer) {
          await existingAnswer.update({ body: value });
        } else {
          await models.SurveyResponseAnswer.create({
            dataElementId,
            body: value,
            responseId: params.id,
          });
        }
      }
    });

    res.send(responseRecord);
  }),
);

surveyResponse.get(
  '/patient-data-field-association-data/:column',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const value = query.value;
    const column = params.column;

    req.checkPermission('read', 'Patient');

    if (!column) {
      throw new InvalidParameterError('Column parameter is required');
    }
    if (!value) {
      res.json({
        data: null,
      });
      return;
    }

    if (!PATIENT_DATA_FIELD_LOCATIONS[column]) {
      throw new InvalidParameterError('Invalid column');
    }

    const [modelName, fieldName] = PATIENT_DATA_FIELD_LOCATIONS[column];

    const { data, targetModel } = await getPatientDataFieldAssociationData({
      models,
      modelName,
      fieldName,
      answer: value,
    });

    res.json({
      model: targetModel,
      data,
    });
  }),
);
