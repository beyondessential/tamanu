import express from 'express';
import asyncHandler from 'express-async-handler';

import { InvalidOperationError } from 'shared/errors';

export const surveyResponse = express.Router();

async function getSurveyEncounter(models, survey, body) {
  const { encounterId, patientId } = body;

  if (encounterId) {
    return models.Encounter.findByPk(body.encounterId);
  }

  if (!patientId) {
    throw new InvalidOperationError(
      'A survey response must have an encounter or patient ID attached',
    );
  }

  const { Encounter } = models;

  // find open encounter
  const openEncounter = await Encounter.findOne({
    where: {
      patientId,
      endDate: null,
    },
  });

  if(openEncounter) {
    return openEncounter;
  }

  const { 
    departmentId,
    examinerId,
    locationId,
  } = body;

  // need to create a new encounter
  return Encounter.create({
    patientId,
    encounterType: 'surveyResponse',
    reasonForEncounter: `Survey response: ${survey.name}`,
    departmentId,
    examinerId,
    locationId,
    startDate: Date.now(),
    endDate: Date.now(),
  });
}

surveyResponse.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body } = req;

    req.checkPermission('create', 'SurveyResponse');

    const { answers, ...responseData } = body;

    const answerKeys = Object.keys(answers);
    if (answerKeys.length === 0) {
      throw new InvalidOperationError('At least one answer must be provided');
    }

    const survey = await models.Survey.findByPk(body.surveyId);
    const encounter = await getSurveyEncounter(models, survey, body);
    const responseRecord = await models.SurveyResponse.create({
      ...responseData,
      encounterId: encounter.id,
      surveyId: survey.id,
    });

    await Promise.all(
      answerKeys.map(ak =>
        models.SurveyResponseAnswer.create({
          dataElementId: ak,
          responseId: responseRecord.id,
          body: answers[ak],
        }),
      ),
    );

    res.send(responseRecord);
  }),
);
