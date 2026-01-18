// Much of this file is duplicated in `packages/mobile/App/ui/components/Forms/SurveyForm/helpers.ts`
import React from 'react';
import * as yup from 'yup';
import { intervalToDuration, parseISO } from 'date-fns';
import { camelCase, isNull, isUndefined } from 'lodash';
import { toast } from 'react-toastify';
import { checkJSONCriteria } from '@tamanu/shared/utils/criteria';
import {
  PATIENT_DATA_FIELD_LOCATIONS,
  PROGRAM_DATA_ELEMENT_TYPES,
  READONLY_DATA_FIELDS,
  SEX_LABELS,
} from '@tamanu/constants';
import { convertToBase64 } from '@tamanu/utils/encodings';
import {
  ageInMonths,
  ageInWeeks,
  ageInYears,
  getCurrentDateTimeString,
} from '@tamanu/utils/dateTime';
import { getPatientNameAsString, TranslatedText } from '../components';
import { notify } from './notify';

const notifyError = (msg, props) => notify(msg, { ...props, type: 'error' });

const joinNames = data => [data.firstName ?? '', data.lastName ?? ''].join(' ').trim();

const isNullOrUndefined = value => isNull(value) || isUndefined(value);

// TODO: figure out why defaultOptions is an object in the database, should it be an array? Also what's up with options, is it ever set by anything? There's no survey_screen_component.options in the db that are not null.
export function mapOptionsToValues(options) {
  if (!options) return null;
  if (typeof options === 'object') {
    // sometimes this is a map of value => value
    return Object.values(options).map(x => ({ label: x, value: x }));
  }
  if (!Array.isArray(options)) return null;
  return options.map(x => ({ label: x, value: x }));
}

/**
 * IMPORTANT: We have 4 other versions of this method:
 *
 * - mobile/App/ui/helpers/fields.ts
 * - web/app/utils/survey.js
 * - shared/src/utils/fields.js
 * - central-server/app/subCommands/calculateSurveyResults.js
 *
 * So if there is an update to this method, please make the same update
 * in the other versions
 */
export function checkVisibility(component, values, allComponents) {
  const { visibilityCriteria } = component;
  // nothing set - show by default
  if (!visibilityCriteria) return true;

  try {
    const valuesByCode = Object.entries(values).reduce((acc, [key, val]) => {
      const matchingComponent = allComponents.find(x => x.dataElement.id === key);
      if (matchingComponent) {
        acc[matchingComponent.dataElement.code] = val;
      }
      return acc;
    }, {});
    return checkJSONCriteria(visibilityCriteria, allComponents, valuesByCode);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Error parsing visibility criteria as JSON, using fallback.
                  \nError message: ${error}
                  \nJSON: ${visibilityCriteria}`);

    return fallbackParseVisibilityCriteria(component, values, allComponents);
  }
}

function fallbackParseVisibilityCriteria({ visibilityCriteria, dataElement }, values, components) {
  if (
    [PROGRAM_DATA_ELEMENT_TYPES.RESULT, PROGRAM_DATA_ELEMENT_TYPES.CALCULATED].includes(
      dataElement.type,
    )
  ) {
    return false;
  }
  if (!visibilityCriteria) return true;

  const [code, requiredValue] = visibilityCriteria.split(':').map(x => x.trim());
  const referencedComponent = components.find(c => c.dataElement.code === code);
  if (!referencedComponent) return true;

  const key = referencedComponent.dataElement.id;
  const formValue = values[key];

  const sanitisedValue = (requiredValue || '').toLowerCase().trim();

  if (typeof formValue === 'boolean') {
    if (formValue && sanitisedValue === 'yes') return true;
    if (!formValue && sanitisedValue === 'no') return true;
  }

  if (sanitisedValue === (formValue || '').toLowerCase().trim()) return true;

  return false;
}

function getInitialValue(dataElement) {
  switch (dataElement.type) {
    case PROGRAM_DATA_ELEMENT_TYPES.TEXT:
    case PROGRAM_DATA_ELEMENT_TYPES.MULTILINE:
    case PROGRAM_DATA_ELEMENT_TYPES.NUMBER:
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE: // This is important (doesn't make sense that it is important though...)
      return '';
    case PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_DATE:
      return getCurrentDateTimeString();
    default:
      return undefined;
  }
}

export function getConfigObject(componentId, config) {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid config in survey screen component ${componentId}`);
    return {};
  }
}

export const getPatientDataDbLocation = columnName => {
  const [modelName, fieldName] = PATIENT_DATA_FIELD_LOCATIONS[columnName] ?? [null, null];
  return {
    modelName,
    fieldName,
  };
};

export const getTooltip = (type, config, getTranslation) => {
  if (type === PROGRAM_DATA_ELEMENT_TYPES.COMPLEX_CHART_INSTANCE_NAME) {
    return getTranslation('complexChartInstance.tooltip', 'Will be displayed as chart name');
  }

  return config.tooltip;
};

function transformPatientData(patient, additionalData, patientProgramRegistration, config) {
  const { column = 'fullName' } = config;
  const { dateOfBirth, firstName, lastName } = patient;

  const { months, years } = intervalToDuration({
    start: parseISO(dateOfBirth),
    end: new Date(),
  });

  const yearPlural = years !== 1 ? 's' : '';
  const monthPlural = months !== 1 ? 's' : '';

  switch (column) {
    case READONLY_DATA_FIELDS.AGE:
      return years.toString();
    case READONLY_DATA_FIELDS.AGE_WITH_MONTHS:
      if (!years) {
        return `${months} month${monthPlural}`;
      }
      return `${years} year${yearPlural}, ${months} month${monthPlural}`;
    case READONLY_DATA_FIELDS.FULL_NAME:
      return joinNames({ firstName, lastName });
    default: {
      const { modelName, fieldName } = getPatientDataDbLocation(column);
      switch (modelName) {
        case 'Patient':
          return patient[fieldName];
        case 'PatientAdditionalData':
          return additionalData ? additionalData[fieldName] : undefined;
        case 'PatientProgramRegistration':
          return patientProgramRegistration ? patientProgramRegistration[fieldName] : undefined;
        default: {
          // Check for custom patient fields
          const { fieldValues } = patient;
          const fieldValue = fieldValues.find(x => x.definitionId === column);
          if (fieldValue) return fieldValue.value;

          return undefined;
        }
      }
    }
  }
}
export function getFormInitialValues(
  components,
  patient,
  additionalData,
  currentUser = {},
  patientProgramRegistration,
) {
  const initialValues = components.reduce((acc, { dataElement }) => {
    const initialValue = getInitialValue(dataElement);
    const propName = dataElement.id;
    if (isNullOrUndefined(initialValue)) {
      return acc;
    }
    acc[propName] = initialValue;
    return acc;
  }, {});

  // other data
  for (const component of components) {
    // type definition of config is string, but in usage its an object...
    const config = getConfigObject(component.id, component.config) || {};

    // current user data
    if (component.dataElement.type === 'UserData') {
      const { column = 'displayName' } = config;
      const userValue = currentUser[column];
      if (userValue !== undefined) {
        initialValues[component.dataElement.id] = userValue;
      }
    }
    // patient data
    if (component.dataElement.type === 'PatientData') {
      let patientValue = transformPatientData(
        patient,
        additionalData,
        patientProgramRegistration,
        config,
      );

      // Let the initial value be null of undefined rather than an empty string so that it doesn't save an empty answer record.
      initialValues[component.dataElement.id] = patientValue;
    }
  }
  return initialValues;
}

export const getAnswersFromData = async (data, survey) => {
  const answers = {};
  for (const [key, val] of Object.entries(data)) {
    const currentComponent = survey.components.find(({ dataElement }) => dataElement.id === key);
    const currentDataElementType = currentComponent?.dataElement?.type;
    if (currentDataElementType === PROGRAM_DATA_ELEMENT_TYPES.PHOTO && val instanceof File) {
      try {
        const size = val.size;
        const base64Data = await convertToBase64(val);
        answers[key] = { size, data: base64Data };
      } catch (e) {
        toast.error(e.message);
        throw e;
      }
    } else if (currentDataElementType !== 'PatientIssue') {
      answers[key] = val;
    }
  }
  return answers;
};

export const getValidationSchema = (surveyData, getTranslation, valuesToCheckMandatory = {}) => {
  if (!surveyData) return {};
  const { components } = surveyData;
  const schema = components.reduce(
    (
      acc,
      {
        id: componentId,
        dataElement,
        validationCriteria,
        config,
        dataElementId,
        text: componentText,
      },
    ) => {
      const { unit = '' } = getConfigObject(componentId, config);
      const {
        min,
        max,
        mandatory: mandatoryConfig,
      } = getConfigObject(componentId, validationCriteria);
      const { type, defaultText } = dataElement;
      const text = componentText || defaultText;
      const isGeolocateType = type === PROGRAM_DATA_ELEMENT_TYPES.GEOLOCATE;
      const mandatory = isGeolocateType
        ? false
        : checkMandatory(mandatoryConfig, valuesToCheckMandatory);

      let valueSchema;
      switch (type) {
        case PROGRAM_DATA_ELEMENT_TYPES.NUMBER: {
          valueSchema = yup.number().nullable();
          if (typeof min === 'number' && !isNaN(min)) {
            // yup todo: theses ones require whole other logic repeat
            valueSchema = valueSchema.min(min, `${text} must be at least ${min}${unit}`);
          }
          if (typeof max === 'number' && !isNaN(max)) {
            valueSchema = valueSchema.max(max, `${text} can not exceed ${max}${unit}`);
          }
          break;
        }
        case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE:
        case PROGRAM_DATA_ELEMENT_TYPES.TEXT:
        case PROGRAM_DATA_ELEMENT_TYPES.SELECT:
          valueSchema = yup.string();
          break;
        case PROGRAM_DATA_ELEMENT_TYPES.DATE:
        case PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME:
        case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
          valueSchema = yup
            .date()
            .transform((value, originalValue) => {
              // Convert empty strings to null/undefined to prevent validation errors
              if (typeof originalValue === 'string' && originalValue.trim() === '') {
                return null;
              }
              return value;
            });
          break;
        default:
          valueSchema = yup.mixed();
          break;
      }
      return {
        ...acc,
        [dataElementId]: valueSchema[mandatory ? 'required' : 'notRequired'](
          mandatory ? getTranslation('validation.required.inline', '*Required') : null,
        ),
      };
    },
    {},
  );
  return yup.object().shape(schema);
};

/*
  Only applies to vitals survey components:
  Validation criteria normal range can be different by age but we also need
  to support the previous format where only one is specified.
  This will also be on mobile in file /App/ui/components/VitalsTable/index.tsx
  both should be changed together. Though note that the functions might not
  be exactly the same because of different APIs.
*/
export const getNormalRangeByAge = (validationCriteria = {}, { dateOfBirth }) => {
  const { normalRange = {} } = validationCriteria;
  if (Array.isArray(normalRange) === false) {
    return normalRange;
  }

  const age = {
    years: ageInYears(dateOfBirth),
    months: ageInMonths(dateOfBirth),
    weeks: ageInWeeks(dateOfBirth),
  };

  const normalRangeByAge = normalRange.find(
    ({ ageUnit = '', ageMin = -Infinity, ageMax = Infinity }) => {
      if (['years', 'months', 'weeks'].includes(ageUnit) === false) return false;
      const ageInUnit = age[ageUnit];
      return ageInUnit >= ageMin && ageInUnit < ageMax;
    },
  );

  return normalRangeByAge;
};

// Re-use getNormalRangeByAge logic - needs to change the shape of the objects to work
export const getGraphRangeByAge = (visualisationConfig, patientData) => {
  const mockedValidationCriteria = { normalRange: visualisationConfig.yAxis.graphRange };
  return getNormalRangeByAge(mockedValidationCriteria, patientData);
};

export const checkMandatory = (mandatory, values) => {
  try {
    if (!mandatory) {
      return false;
    }
    if (typeof mandatory === 'boolean') {
      return mandatory;
    }

    return checkJSONCriteria(JSON.stringify(mandatory), [], values);
  } catch (error) {
    notifyError(
      <TranslatedText
        stringId="general.notification.useMandatoryFailed"
        fallback={`Failed to use mandatory in validationCriteria: ${JSON.stringify(
          mandatory,
        )}, error: ${error.message}`}
        replacements={{ mandatory: JSON.stringify(mandatory), message: error.message }}
      />,
    );
    return false;
  }
};

export const getPatientDataDisplayValue = async ({
  api,
  getEnumTranslation,
  getReferenceDataTranslation,
  formatShort,
  value,
  config,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [modelName, _, options] = PATIENT_DATA_FIELD_LOCATIONS[config.column] || [];
  if (!modelName) {
    // If the field is a custom field, we need to display the raw value
    return value;
  } else if (options) {
    // If the field is a standard field with options, we need to translate the value
    const translation = getEnumTranslation(options, value);
    return translation || value;
  } else {
    // If the field is a standard field without options, we need to query the display value
    try {
      const { data, model } = await api.get(
        `surveyResponse/patient-data-field-association-data/${config.column}`,
        {
          value,
        },
      );
      if (!model) return value;

      switch (model) {
        case 'ReferenceData':
          return getReferenceDataTranslation({
            value: data.id,
            category: data.type,
            fallback: data.name,
          });
        case 'User':
          return data?.displayName;
        case 'Patient':
          return `${getPatientNameAsString(data)} (${data.displayId}) - ${getEnumTranslation(
            SEX_LABELS,
            data.sex,
          )} - ${formatShort(data.dateOfBirth)}`;
        default: {
          const category = camelCase(model);
          return getReferenceDataTranslation({
            value: data.id,
            category,
            fallback: data.name || value,
          });
        }
      }
    } catch (error) {
      return value;
    }
  }
};
