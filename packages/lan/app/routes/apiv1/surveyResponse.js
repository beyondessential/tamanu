import express from 'express';
import asyncHandler from 'express-async-handler';

import config from 'config';

import { REFERENCE_TYPES } from 'shared/constants';

export const surveyResponse = express.Router();

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponseRecord.surveyId,
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    const autocompleteComponents = components
      .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
      .map(({ dataElementId, config: componentConfig }) => [
        dataElementId,
        JSON.parse(componentConfig),
      ]);
    const autocompleteComponentMap = new Map(autocompleteComponents);

    // Transform Autocomplete answers from: { body: ReferenceData.id } to: { body: ReferenceData.name, originalBody: ReferenceData.id }
    const transformedAnswers = await Promise.all(
      answers.map(async answer => {
        const componentConfig = autocompleteComponentMap.get(answer.dataValues.dataElementId);
        if (!componentConfig) {
          return answer;
        }
        const result = await models[componentConfig.source].findByPk(answer.dataValues.body);
        const answerDisplayValue =
          result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];

        const transformedAnswer = {
          ...answer.dataValues,
          originalBody: answer.dataValues.body,
          body: answerDisplayValue,
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

    req.checkPermission('create', 'SurveyResponse');

    const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type);
    const updatedBody = {
      locationId: body.locationId || (await getDefaultId('location')),
      departmentId: body.departmentId || (await getDefaultId('department')),
      examinerId: req.user.id,
      ...body,
    };

    await db.transaction(async () => {
      const responseRecord = await models.SurveyResponse.createWithAnswers(updatedBody);

      res.send(responseRecord);
    });
  }),
);
