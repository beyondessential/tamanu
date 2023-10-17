// Much of this file is duplicated in `packages/mobile/App/ui/components/Forms/SurveyForm/helpers.ts`
import React from 'react';
import * as yup from 'yup';
import { checkJSONCriteria } from '@tamanu/shared/utils/criteria';
import { intervalToDuration, parseISO } from 'date-fns';

import {
  LimitedTextField,
  MultilineTextField,
  SelectField,
  MultiselectField,
  DateField,
  NullableBooleanField,
  SurveyQuestionAutocompleteField,
  SurveyResponseSelectField,
  NumberField,
  ReadOnlyTextField,
  UnsupportedPhotoField,
  DateTimeField,
} from 'desktop/app/components/Field';
import { ageInYears, ageInMonths, ageInWeeks } from '@tamanu/shared/utils/dateTime';
import { PROGRAM_DATA_ELEMENT_TYPES, ACTION_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { joinNames } from './user';
import { notifyError } from './utils';

const InstructionField = ({ label, helperText }) => (
  <p>
    {label} {helperText}
  </p>
);

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: SelectField, // TODO: Implement proper radio field?
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: SelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: MultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: SurveyQuestionAutocompleteField,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: props => <DateField {...props} saveDateAsString />,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME]: props => <DateTimeField {...props} saveDateAsString />,
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: props => <DateField {...props} saveDateAsString />,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: SurveyResponseSelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: UnsupportedPhotoField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: InstructionField,
};

export function getComponentForQuestionType(type, { writeToPatient: { fieldType } = {} }) {
  let component = QUESTION_COMPONENTS[type];
  if (type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA && fieldType) {
    // PatientData specifically can overwrite field type if we are writing back to patient record
    component = QUESTION_COMPONENTS[fieldType];
  }
  if (component === undefined) {
    return LimitedTextField;
  }
  return component;
}
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
 * - desktop/app/utils/survey.js
 * - shared/src/utils/fields.js
 * - sync-server/app/subCommands/calculateSurveyResults.js
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
    console.warn(`Error parsing visilbity criteria as JSON, using fallback.
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
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
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

function transformPatientData(patient, additionalData, config) {
  const { writeToPatient = {}, column = 'fullName' } = config;
  const { isAdditionalDataField = false } = writeToPatient;
  const { dateOfBirth, firstName, lastName } = patient;

  const { months, years } = intervalToDuration({
    start: parseISO(dateOfBirth),
    end: new Date(),
  });

  const yearPlural = years !== 1 ? 's' : '';
  const monthPlural = months !== 1 ? 's' : '';

  switch (column) {
    case 'age':
      return years.toString();
    case 'ageWithMonths':
      if (!years) {
        return `${months} month${monthPlural}`;
      }
      return `${years} year${yearPlural}, ${months} month${monthPlural}`;
    case 'fullName':
      return joinNames({ firstName, lastName });
    default:
      if (isAdditionalDataField) {
        return additionalData ? additionalData[column] : undefined;
      }
      return patient[column];
  }
}

export function getFormInitialValues(components, patient, additionalData, currentUser = {}) {
  const initialValues = components.reduce((acc, { dataElement }) => {
    const initialValue = getInitialValue(dataElement);
    const propName = dataElement.id;
    if (initialValue === undefined) {
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
    if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.USER_DATA) {
      const { column = 'displayName' } = config;
      const userValue = currentUser[column];
      if (userValue !== undefined) initialValues[component.dataElement.id] = userValue;
    }

    // patient data
    if (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA) {
      const patientValue = transformPatientData(patient, additionalData, config);
      if (patientValue !== undefined) initialValues[component.dataElement.id] = patientValue;
    }
  }
  return initialValues;
}

export const getAnswersFromData = (data, survey) =>
  Object.entries(data).reduce((acc, [key, val]) => {
    if (
      survey.components.find(({ dataElement }) => dataElement.id === key)?.dataElement?.type !==
      PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE
    ) {
      acc[key] = val;
    }
    return acc;
  }, {});

export const getActionsFromData = (data, survey) =>
  Object.entries(data).reduce((acc, [key]) => {
    const component = survey.components.find(({ dataElement }) => dataElement.id === key);
    if (ACTION_DATA_ELEMENT_TYPES.includes(component?.dataElement?.type)) {
      if (checkVisibility(component, data, survey.components)) {
        acc[key] = true;
      }
    }
    return acc;
  }, {});

export const getValidationSchema = (surveyData, valuesToCheckMandatory = {}) => {
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
      const { min, max, mandatory: mandatoryConfig } = getConfigObject(
        componentId,
        validationCriteria,
      );
      const { type, defaultText } = dataElement;
      const text = componentText || defaultText;
      const mandatory = checkMandatory(mandatoryConfig, valuesToCheckMandatory);
      let valueSchema;
      switch (type) {
        case PROGRAM_DATA_ELEMENT_TYPES.NUMBER: {
          valueSchema = yup.number().nullable();
          if (typeof min === 'number' && !isNaN(min)) {
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
          valueSchema = yup.date();
          break;
        default:
          valueSchema = yup.mixed();
          break;
      }
      return {
        ...acc,
        [dataElementId]: valueSchema[mandatory ? 'required' : 'notRequired'](
          mandatory ? 'Required' : null,
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
      `Failed to use mandatory in validationCriteria: ${JSON.stringify(mandatory)}, error: ${
        error.message
      }`,
    );
    return false;
  }
};
