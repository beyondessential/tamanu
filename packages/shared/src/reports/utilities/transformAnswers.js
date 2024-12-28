import { parseISO } from 'date-fns';
import { groupBy, keyBy } from 'lodash';
import { differenceInMilliseconds, format, isISOString } from '@tamanu/utils/dateTime';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

// also update getNameColumnForModel in /packages/mobile/App/ui/helpers/fields.ts when this changes
function getNameColumnForModel(modelName) {
  switch (modelName) {
    case 'User':
      return 'displayName';
    default:
      return 'name';
  }
}

// also update getDisplayNameForModel in /packages/mobile/App/ui/helpers/fields.ts when this changes
function getDisplayNameForModel(modelName, record) {
  const columnName = getNameColumnForModel(modelName);
  return record[columnName] || record.id;
}

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
    if (answer === '') {
      return answer;
    }

    if (componentConfig.source === 'ReferenceData') {
      throw new Error(
        `Selected answer ${componentConfig.source}[${answer}] not found (check that the surveyquestion's source isn't ReferenceData for a Location, Facility, or Department)`,
      );
    }

    throw new Error(`Selected answer ${componentConfig.source}[${answer}] not found`);
  }

  return getDisplayNameForModel(componentConfig.source, result);
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

const convertDateAnswer = (answer, { dateFormat = 'dd-MM-yyyy', notTransformDate = false }) => {
  if (notTransformDate) return answer;
  if (isISOString(answer)) {
    return format(answer, dateFormat);
  }
  return '';
};

// Logic duplicated in packages/mobile/App/ui/navigation/screens/programs/SurveyResponseDetailsScreen/index.tsx
const isAutocomplete = ({ config, dataElement }) =>
  dataElement?.type === PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE ||
  (config &&
    JSON.parse(config).writeToPatient?.fieldType === PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE);

export const getAnswerBody = async (models, componentConfig, type, answer, transformConfig) => {
  switch (type) {
    case 'Date':
    case 'SubmissionDate':
      return convertDateAnswer(answer, transformConfig);
    case 'Checkbox':
      return convertBinaryToYesNo(answer);
    case 'Autocomplete':
      return convertAutocompleteAnswer(models, componentConfig, answer);
    default: {
      if (isAutocomplete({ config: JSON.stringify(componentConfig) })) {
        return convertAutocompleteAnswer(models, componentConfig, answer);
      }
      return answer;
    }
  }
};

export const getAutocompleteComponentMap = async (models, surveyComponents) => {
  // Get all survey answer components with config and type from source
  const surveyAnswerComponents = await Promise.all(
    surveyComponents
      .filter(c => c.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER)
      .map(async c => {
        const config = JSON.parse(c.config);
        const ssc = await models.SurveyScreenComponent.findOne({
          include: [
            {
              model: models.ProgramDataElement,
              as: 'dataElement',
              where: {
                code: config.source || config.Source,
              },
            },
          ],
        });
        return {
          ...c,
          lookupSurveyScreenComponent: ssc,
        };
      }),
  );
  const surveyAnswerAutocompleteComponents = surveyAnswerComponents
    .filter(c => isAutocomplete(c.lookupSurveyScreenComponent))
    .map(c => [
      c.dataElementId,
      c.lookupSurveyScreenComponent.config ? JSON.parse(c.lookupSurveyScreenComponent.config) : {},
    ]);

  const autocompleteComponents = surveyComponents
    .filter(isAutocomplete)
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      componentConfig ? JSON.parse(componentConfig) : {},
    ]);

  return new Map([...autocompleteComponents, ...surveyAnswerAutocompleteComponents]);
};

export const transformAnswers = async (
  models,
  surveyResponseAnswers,
  surveyComponents,
  transformConfig = {},
) => {
  const autocompleteComponentMap = await getAutocompleteComponentMap(models, surveyComponents);
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
    let type = dataElementIdToComponent[dataElementId]?.dataElement?.dataValues?.type;
    let sourceType;
    const componentConfig = autocompleteComponentMap.get(dataElementId);

    // If the answer is a survey answer, we need to look up the type from the soruce survey components
    if (type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER) {
      const config = JSON.parse(dataElementIdToComponent[dataElementId].config);
      const ssc = await models.SurveyScreenComponent.findOne({
        include: [
          {
            model: models.ProgramDataElement,
            as: 'dataElement',
            where: {
              code: config.source || config.Source,
            },
          },
        ],
      });
      sourceType = ssc.dataElement.dataValues.type;
    }

    const body = await getAnswerBody(
      models,
      componentConfig,
      sourceType || type,
      answer.body,
      transformConfig,
    );
    const answerObject = {
      id: answer.id,
      surveyId,
      surveyResponseId,
      patientId,
      responseEndTime,
      dataElementId,
      body,
      sourceType,
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
