import express from 'express';
import asyncHandler from 'express-async-handler';

import config from 'config';

import { REFERENCE_TYPES } from 'shared/constants';

export const surveyResponse = express.Router();

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    req.checkPermission('create', 'SurveyResponse');

    const getRefId = async type => {
      const code = config.survey.defaultCodes[type];
      const record = await models.ReferenceData.findOne({ where: { type, code } });
      return record.id;
    };

    const updatedBody = {
      locationId: body.locationId || await getRefId(REFERENCE_TYPES.LOCATION),
      departmentId: body.departmentId || await getRefId(REFERENCE_TYPES.DEPARTMENT),
      examinerId: req.user.id,
      ...body,
    };

    await db.transaction(async () => {
      const responseRecord = await models.SurveyResponse.create(updatedBody);

      res.send(responseRecord);
    });
  }),
);
