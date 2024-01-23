import express from 'express';
import asyncHandler from 'express-async-handler';

import { getAutocompleteComponentMap } from '@tamanu/shared/reports/utilities';
export const surveyResponse = express.Router();

// also update getNameColumnForModel in /packages/facility-server/app/routes/apiv1/surveyResponse.js when this changes
function getNameColumnForModel(modelName) {
  switch (modelName) {
    case 'User':
      return 'displayName';
    default:
      return 'name';
  }
}

// also update getDisplayNameForModel in /packages/mobile/App/ui/helpers/fields.ts when this changes
function getDisplayNameForModel(modelName, record) {
  const columnName = getNameColumnForModel(modelName);
  return record[columnName] || record.id;
}

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponseRecord.surveyId,
      { includeAllVitals: true },
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    const autocompleteComponentMap = getAutocompleteComponentMap(components);

    // Transform Autocomplete answers from: { body: ReferenceData.id } to: { body: ReferenceData.name, originalBody: ReferenceData.id }
    const transformedAnswers = await Promise.all(
      answers.map(async answer => {
        const componentConfig = autocompleteComponentMap.get(answer.dataValues.dataElementId);
        if (!componentConfig) {
          return answer;
        }

        const model = models[componentConfig.source];
        if (!model) {
          throw new Error(
            'Survey is misconfigured: Question config did not specify a valid source',
          );
        }

        const result = await model.findByPk(answer.dataValues.body);
        if (!result) {
          if (componentConfig.source === 'ReferenceData') {
            throw new Error(
              `Selected answer ${componentConfig.source}[${answer.dataValues.body}] not found (check that the surveyquestion's source isn't ReferenceData for a Location, Facility, or Department)`,
            );
          }
          throw new Error(
            `Selected answer ${componentConfig.source}[${answer.dataValues.body}] not found`,
          );
        }
        const transformedAnswer = {
          ...answer.dataValues,
          originalBody: answer.dataValues.body,
          body: getDisplayNameForModel(componentConfig.source, result),
        };
        return transformedAnswer;
      }),
    );

    res.send({
      ...surveyResponseRecord.forResponse(),
      components,
      answers: transformedAnswers,
    });
  }),
);

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    // Responses for the vitals survey will check against 'Vitals' create permissions
    // All others witll check against 'SurveyResponse' create permissions
    const noun = await models.Survey.getResponsePermissionCheck(body.surveyId);
    req.checkPermission('create', noun);

    const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      userId: req.user.id,
      ...body,
    };

    const responseRecord = await db.transaction(async () => {
      return models.SurveyResponse.createWithAnswers(updatedBody);
    });
    res.send(responseRecord);
  }),
);
