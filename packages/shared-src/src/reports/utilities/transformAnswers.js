import moment from 'moment';

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

export const transformAnswers = async (models, surveyResponseAnswers, surveyComponents) => {
  const autocompleteComponents = surveyComponents
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      JSON.parse(componentConfig),
    ]);
  const dateDataElementIds = surveyComponents
    .filter(c => ['Date', 'SubmissionDate'].includes(c.dataElement.dataValues.type))
    .map(component => component.dataElementId);
  const autocompleteComponentMap = new Map(autocompleteComponents);

  // Some questions in the front end are not answered but still record the answer as empty string in the database
  // So we should filter any answers thare are empty.
  const nonEmptyAnswers = surveyResponseAnswers.filter(
    answer => answer.body !== null && answer.body !== undefined && answer.body !== '',
  );

  const transformedAnswers = [];

  // Transform Autocomplete answers from: ReferenceData.id to ReferenceData.name
  for (const answer of nonEmptyAnswers) {
    const surveyResponseId = answer.surveyResponse?.id;
    const patientId = answer.surveyResponse?.encounter?.patientId;
    const responseEndTime = answer.surveyResponse?.endTime;
    const dataElementId = answer.dataElementId;
    const body =
      dateDataElementIds.includes(dataElementId) && answer.body
        ? moment(answer.body).format('DD-MM-YYYY')
        : answer.body;
    const componentConfig = autocompleteComponentMap.get(dataElementId);
    const nonReferencedAnswer = {
      surveyResponseId,
      patientId,
      responseEndTime,
      dataElementId,
      body,
    };
    if (!componentConfig) {
      transformedAnswers.push(nonReferencedAnswer);
      continue;
    }

    const result = await models[componentConfig.source].findByPk(body);
    if (!result) {
      transformedAnswers.push(nonReferencedAnswer);
      continue;
    }

    const answerDisplayValue = result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
    const transformedAnswer = {
      surveyResponseId,
      patientId,
      responseEndTime,
      dataElementId,
      body: answerDisplayValue,
    };
    transformedAnswers.push(transformedAnswer);
  }

  return transformedAnswers;
};
