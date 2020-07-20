import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidOperationError } from 'shared/errors';

export const surveyResponse = express.Router();

async function getSurveyEncounter(models, body) {
  if(body.encounterId) {
    return models.Encounter.findByPk(body.encounterId);
  }
  if(body.patientId) {
    throw new InvalidOperationError("A survey cannot be submitted directly against a patient yet");
    /*
    return models.Encounter.create({
      patientId,
      encounterType: 'surveyResponse',
      startDate: Date.now(),
      endDate: Date.now(),
    });
    */
  }

  throw new InvalidOperationError("A survey response must have an encounter or patient ID attached");
}

surveyResponse.post('/$', asyncHandler(async (req, res) => {
  const { models, body } = req;

  req.checkPermission('create', 'SurveyResponse');

  const { answers, ...responseData } = body;

  const answerKeys = Object.keys(answers);
  if(answerKeys.length === 0) {
    throw new InvalidOperationError("At least one answer must be provided");
  }

  const encounter = await getSurveyEncounter(models, body);
  const survey = await models.Survey.findByPk(body.surveyId);
  const responseRecord = await models.SurveyResponse.create({
    encounterId: encounter.id,
    surveyId: survey.id,
  });

  await Promise.all(answerKeys.map(ak => models.SurveyResponseAnswer.create({
    dataElementId: ak,
    responseId: responseRecord.id,
    body: answers[ak],
  })));

  res.send(responseRecord);
}));
