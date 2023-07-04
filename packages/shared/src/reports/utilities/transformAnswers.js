import { parseISO } from 'date-fns';
import { keyBy, groupBy } from 'lodash';
import { format, differenceInMilliseconds, isISOString } from '../../utils/dateTime';

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
};

const convertAutocompleteAnswer = async (models, componentConfig, answer) => {
  if (!componentConfig) {
    return answer;
  }

  const model = models[componentConfig.source];
  if (!model) {
    throw new Error(`no model for componentConfig ${JSON.stringify(componentConfig)}`);
  }

  const result = await model.findByPk(answer);
  if (!result) {
    return answer;
  }

  return result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source] || 'name'];
};

const convertBinaryToYesNo = answer => {
  switch (answer) {
    case 'true':
    case '1':
      return 'Yes';
    case 'false':
    case '0':
      return 'No';
    default:
      return answer;
  }
};

const convertDateAnswer = (answer, { dateFormat = 'dd-MM-yyyy' }) => {
  if (isISOString(answer)) {
    return format(answer, dateFormat);
  }
  return '';
};

export const getAnswerBody = async (models, componentConfig, type, answer, transformConfig) => {
  switch (type) {
    case 'Date':
    case 'SubmissionDate':
      return convertDateAnswer(answer, transformConfig);
    case 'Checkbox':
      return convertBinaryToYesNo(answer);
    case 'Autocomplete':
      return convertAutocompleteAnswer(models, componentConfig, answer);
    default:
      return answer;
  }
};

export const getAutocompleteComponentMap = surveyComponents => {
  const autocompleteComponents = surveyComponents
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      componentConfig ? JSON.parse(componentConfig) : {},
    ]);
  return new Map(autocompleteComponents);
};

export const transformAnswers = async (
  models,
  surveyResponseAnswers,
  surveyComponents,
  transformConfig = {},
) => {
  const autocompleteComponentMap = getAutocompleteComponentMap(surveyComponents);
  const dataElementIdToComponent = keyBy(surveyComponents, component => component.dataElementId);

  // Some questions in the front end are not answered but still record the answer as empty string in the database
  // So we should filter any answers thare are empty.
  const nonEmptyAnswers = surveyResponseAnswers.filter(
    answer => answer.body !== null && answer.body !== undefined && answer.body !== '',
  );

  const transformedAnswers = [];

  // Transform Autocomplete answers from: ReferenceData.id to ReferenceData.name
  for (const answer of nonEmptyAnswers) {
    const surveyId = answer.surveyResponse?.surveyId;
    const surveyResponseId = answer.surveyResponse?.id;
    const patientId = answer.surveyResponse?.encounter?.patientId;
    const responseEndTime = answer.surveyResponse?.endTime;
    const { dataElementId } = answer;
    const type =
      dataElementIdToComponent[dataElementId]?.dataElement?.dataValues?.type || 'unknown';
    const componentConfig = autocompleteComponentMap.get(dataElementId);

    const body = await getAnswerBody(models, componentConfig, type, answer.body, transformConfig);
    const answerObject = {
      surveyId,
      surveyResponseId,
      patientId,
      responseEndTime,
      dataElementId,
      body,
    };
    transformedAnswers.push(answerObject);
  }

  return transformedAnswers;
};

export const takeMostRecentAnswers = answers => {
  const answersPerElement = groupBy(
    answers,
    a => `${a.patientId}|${a.surveyId}|${a.dataElementId}`,
  );

  const results = [];
  for (const groupedAnswers of Object.values(answersPerElement)) {
    const sortedLatestToOldestAnswers = groupedAnswers.sort((a1, a2) =>
      differenceInMilliseconds(parseISO(a2.responseEndTime), parseISO(a1.responseEndTime)),
    );
    results.push(sortedLatestToOldestAnswers[0]);
  }

  return results;
};
