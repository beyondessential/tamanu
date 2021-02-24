import express from 'express';
import asyncHandler from 'express-async-handler';

import config from 'config';

import { REFERENCE_TYPES } from 'shared/constants';

export const surveyResponse = express.Router();

surveyResponse.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('read', 'SurveyResponse');

    const surveyResponse = await models.SurveyResponse.findByPk(params.id);
    const components = await models.SurveyScreenComponent.getComponentsForSurvey(
      surveyResponse.surveyId,
    );
    const answers = await models.SurveyResponseAnswer.findAll({
      where: { responseId: params.id },
    });

    res.send({
      ...surveyResponse.forResponse(),
      components,
      answers,
    });
  }),
);

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    req.checkPermission('create', 'SurveyResponse');

    const getRefDataId = async type => {
      const code = config.survey.defaultCodes[type];
      const record = await models.ReferenceData.findOne({ where: { type, code } });
      if (!record) {
        return null;
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
      const responseRecord = await models.SurveyResponse.create(updatedBody);

      res.send(responseRecord);
    });
  }),
);
