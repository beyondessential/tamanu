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

    /** TODO: Remove this temporary code to handle required locationId and departmentId fields */
    const getRefDataId = async type => {
      const code = config.survey.defaultCodes[type];
      const record = await models.ReferenceData.findOne({ where: { type, code } });
      if (!record) {
        throw new Error(
          `Could not look up default reference data type ${type} for encounter: code ${code} not found (check survey.defaultCodes.${type} in the config)`,
        );
      }
      return record.id;
    };

    const updatedBody = {
      locationId: body.locationId || (await getRefDataId(REFERENCE_TYPES.LOCATION)),
      departmentId: body.departmentId || (await getRefDataId(REFERENCE_TYPES.DEPARTMENT)),
      examinerId: req.user.id,
      ...body,
    };

    await db.transaction(async () => {
      const responseRecord = await models.SurveyResponse.createWithAnswers(updatedBody);

      res.send(responseRecord);
    });
  }),
);
