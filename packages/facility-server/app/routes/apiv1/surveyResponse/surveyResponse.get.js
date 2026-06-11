import asyncHandler from 'express-async-handler';

import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
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

  const transformedAnswersById = new Map(transformedAnswers.map(a => [a.id, a]));

  const dataElementTypesById = new Map(components.map(c => [c.dataElementId, c.dataElement?.type]));
  function isSignature(answer) {
    const type = dataElementTypesById.get(answer.dataElementId);
    return type === PROGRAM_DATA_ELEMENT_TYPES.SIGNATURE;
  }

  res.send({
    ...surveyResponseRecord.forResponse(),
    surveyName: survey.name,
    components,
    answers: answers.map(answer => {
      const transformedAnswer = transformedAnswersById.get(answer.id);
      const apiBody = transformedAnswer?.body;
      return {
        ...answer.dataValues,
        originalBody: isSignature(answer) ? apiBody : answer.body,
        body: apiBody,
        sourceType: transformedAnswer?.sourceType,
        sourceConfig: transformedAnswer?.sourceConfig,
      };
    }),
  });
});
