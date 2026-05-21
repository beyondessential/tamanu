import asyncHandler from 'express-async-handler';

import { NotFoundError } from '@tamanu/errors';
import { transformAnswers } from '@tamanu/shared/reports/utilities/transformAnswers';

export const surveyResponseGetHandler = asyncHandler(async (req, res) => {
  const { models, params, query } = req;
  req.checkPermission('read', 'SurveyResponse');

  const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
  if (!surveyResponseRecord) {
    throw new NotFoundError('Survey response not found');
  }
  const survey = await surveyResponseRecord.getSurvey();
  if (!survey) {
    throw new NotFoundError('Associated survey not found');
  }

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
});
