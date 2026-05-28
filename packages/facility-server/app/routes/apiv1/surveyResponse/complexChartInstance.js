import { subject } from '@casl/ability';
import asyncHandler from 'express-async-handler';

import { SURVEY_TYPES } from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';

export const complexChartInstancePutHandler = asyncHandler(async (req, res) => {
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
});
