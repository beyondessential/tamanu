import { keyBy } from 'lodash-es';

import { PATIENT_DATA_FIELD_LOCATIONS, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { convertBinaryToYesNo } from '@tamanu/utils/criteria';
import { format, isISOString, parseDate } from '@tamanu/utils/dateTime';
import { formatShort } from '@tamanu/utils/dateFormatters';
import { decompressSignatureBody } from '../../utils/signature';

// also update getDisplayNameForModel in /packages/mobile/App/ui/helpers/fields.ts when this changes
function getDisplayNameForModel(modelName, record) {
  let result = '';
  switch (modelName) {
    case 'User':
      result = record['displayName'];
      break;
    case 'Patient':
      // follow the same format as the patient label in usePatientSuggester
      result = `${[record.firstName, record.lastName].filter(Boolean).join(' ')} (${record.displayId}) - ${
        record.sex
      } - ${record.dateOfBirth ? formatShort(parseDate(record.dateOfBirth)) : ''}`;
      break;
    default:
      result = record?.['name'];
      break;
  }

  return result || record.id;
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

const convertDateAnswer = (answer, { dateFormat = 'dd-MM-yyyy', notTransformDate = false }) => {
  if (notTransformDate) return answer;
  if (isISOString(answer)) {
    return format(answer, dateFormat);
  }
  return '';
};

export const getPatientDataFieldAssociationData = async ({
  models,
  modelName,
  fieldName,
  answer,
}) => {
  const model = models[modelName];
  const associations = Object.values(model.associations || {});
  const foreignKeyAssociation = associations.find(
    association => association.foreignKey === fieldName,
  );
  if (!foreignKeyAssociation) return { data: answer, targetModel: null };
  const targetModel = foreignKeyAssociation.target.name;
  const result = await models[targetModel].findOne({
    where: {
      id: answer,
    },
  });
  return { data: result, targetModel };
};

const convertPatientDataAnswer = async (models, componentConfig, answer) => {
  const [modelName, fieldName, options] =
    PATIENT_DATA_FIELD_LOCATIONS[componentConfig.column] || [];
  if (!modelName) {
    // If the field is a custom field, we need to display the raw value
    return answer;
  } else if (options) {
    // If the field is a standard field with options, we need to translate the value
    const label = options[answer];
    return label || answer;
  } else {
    const { data, targetModel } = await getPatientDataFieldAssociationData({
      models,
      modelName,
      fieldName,
      answer,
    });
    if (!targetModel || !data) return data ?? answer;
    return getDisplayNameForModel(targetModel, data);
  }
};

/** @param {string | null | undefined} answer */
async function convertSignatureAnswer(answer) {
  return await decompressSignatureBody(answer);
}

export const getAnswerBody = async (
  models,
  componentConfig,
  originalType,
  answer,
  transformConfig,
) => {
  let parsedComponentConfig = {};
  let type = originalType;
  let sourceType, sourceConfig;
  try {
    if (componentConfig) {
      parsedComponentConfig = JSON.parse(componentConfig);
    }
    if (type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER) {
      const ssc = await models.SurveyScreenComponent.findOne({
        include: [
          {
            model: models.ProgramDataElement,
            as: 'dataElement',
            where: {
              code: parsedComponentConfig.source || parsedComponentConfig.Source,
            },
          },
        ],
      });
      type = ssc.dataElement.dataValues.type;
      parsedComponentConfig = ssc.config ? JSON.parse(ssc.config) : {};
      sourceType = type;
      sourceConfig = ssc.config;
    }
  } catch (error) {
    console.error('Error parsing componentConfig', error);
  }
  let result;
  switch (type) {
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
    case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
      result = convertDateAnswer(answer, transformConfig);
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.TIME:
      result = answer;
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.BINARY:
    case PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX:
      result = convertBinaryToYesNo(answer);
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
      result = await convertAutocompleteAnswer(models, parsedComponentConfig, answer);
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA:
      result = await convertPatientDataAnswer(models, parsedComponentConfig, answer);
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.SIGNATURE:
      result = await convertSignatureAnswer(answer);
      break;
    default:
      result = answer;
  }

  return {
    body: result,
    sourceType,
    sourceConfig,
  };
};

export const transformAnswers = async (
  models,
  surveyResponseAnswers,
  surveyComponents,
  transformConfig = {},
) => {
  const dataElementIdToComponent = keyBy(surveyComponents, component => component.dataElementId);

  // Some questions in the front end are not answered but still record the answer as empty string in the database
  // So we should filter any answers that are empty.
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
    const surveyComponent = dataElementIdToComponent[dataElementId];
    let type = surveyComponent?.dataElement?.dataValues?.type;
    const componentConfig = surveyComponent?.config;

    const { body, sourceType, sourceConfig } = await getAnswerBody(
      models,
      componentConfig,
      type,
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
      sourceConfig,
    };
    transformedAnswers.push(answerObject);
  }

  return transformedAnswers;
};
