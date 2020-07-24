import express from 'express';
import asyncHandler from 'express-async-handler';

export const surveyResponse = express.Router();

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, db } = req;

    req.checkPermission('create', 'SurveyResponse');

    await db.transaction(async () => {
      const responseRecord = await models.SurveyResponse.create(body);

      res.send(responseRecord);
    });
  }),
);
