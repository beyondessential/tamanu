import moment from 'moment';
import { keyBy } from 'lodash';

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

const convertAutocompleteAnswer = async (models, componentConfig, answer) => {
  if (!componentConfig) {
    return answer;
  }

  const result = await models[componentConfig.source].findByPk(answer);
  if (!result) {
    return answer;
  }

  return result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
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

const convertDateAnswer = answer => (answer ? moment(answer).format('DD-MM-YYYY') : '');

const getAnswerBody = async (models, componentConfig, type, answer) => {
  switch (type) {
    case 'Date':
    case 'SubmissionDate':
      return convertDateAnswer(answer);
    case 'Checkbox':
      return convertBinaryToYesNo(answer);
    case 'Autocomplete':
      return convertAutocompleteAnswer(models, componentConfig, answer);
    default:
      return answer;
  }
};

export const transformAnswers = async (models, surveyResponseAnswers, surveyComponents) => {
  const autocompleteComponents = surveyComponents
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      JSON.parse(componentConfig),
    ]);
  const autocompleteComponentMap = new Map(autocompleteComponents);
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
    const dataElementId = answer.dataElementId;
    const type =
      dataElementIdToComponent[dataElementId]?.dataElement?.dataValues?.type || 'unknown';
    const componentConfig = autocompleteComponentMap.get(dataElementId);
    const body = await getAnswerBody(models, componentConfig, type, answer.body);
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
