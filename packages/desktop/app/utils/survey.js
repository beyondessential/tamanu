import React from 'react';
import { create, all as allMath } from 'mathjs';
import { inRange } from 'lodash';

import {
  LimitedTextField,
  MultilineTextField,
  SelectField,
  MultiselectField,
  DateField,
  NullableBooleanField,
  SurveyQuestionAutocomplete,
  NumberField,
  ReadOnlyTextField,
  UnsupportedPhotoField,
  // PatientIssueCreatorField,
} from 'desktop/app/components/Field';
import { PROGRAM_DATA_ELEMENT_TYPES } from '../../../shared-src/src/constants';
import { getAgeFromDate } from 'shared-src/src/utils/date';
import { joinNames } from './user';

const InstructionField = ({ label, helperText }) => (
  <p>{label} {helperText}</p>
);

const QUESTION_COMPONENTS = {
  [PROGRAM_DATA_ELEMENT_TYPES.TEXT]: LimitedTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTILINE]: MultilineTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.RADIO]: SelectField, // TODO: Implement proper radio field?
  [PROGRAM_DATA_ELEMENT_TYPES.SELECT]: SelectField,
  [PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT]: MultiselectField,
  [PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE]: SurveyQuestionAutocomplete,
  [PROGRAM_DATA_ELEMENT_TYPES.DATE]: DateField,
  [PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE]: DateField,
  [PROGRAM_DATA_ELEMENT_TYPES.NUMBER]: NumberField,
  [PROGRAM_DATA_ELEMENT_TYPES.BINARY]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX]: NullableBooleanField,
  [PROGRAM_DATA_ELEMENT_TYPES.CALCULATED]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.USER_DATA]: ReadOnlyTextField,
  [PROGRAM_DATA_ELEMENT_TYPES.INSTRUCTION]: InstructionField,
  [PROGRAM_DATA_ELEMENT_TYPES.PHOTO]: UnsupportedPhotoField,
  [PROGRAM_DATA_ELEMENT_TYPES.RESULT]: null,
  [PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE]: ReadOnlyTextField,
};

export function getComponentForQuestionType(type) {
  const component = QUESTION_COMPONENTS[type];
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

export function checkVisibility(
  component,
  values,
  allComponents,
) {
  const { visibilityCriteria, dataElement } = component;
  // nothing set - show by default
  if (!visibilityCriteria) return true;

  try {
    const criteriaObject = JSON.parse(visibilityCriteria);

    if (!criteriaObject) {
      return true;
    }

    const { _conjunction: conjunction, hidden, ...restOfCriteria } = criteriaObject;
    if (Object.keys(restOfCriteria).length === 0) {
      return true;
    }

    const checkIfQuestionMeetsCriteria = ([questionId, answersEnablingFollowUp]) => {
      const value = values[questionId];
      if (answersEnablingFollowUp.type === 'range') {
        if (!value) return false;
        const { start, end } = answersEnablingFollowUp;

        if (!start) return value < end;
        if (!end) return value >= start;
        if (inRange(parseFloat(value), parseFloat(start), parseFloat(end))) {
          return true;
        }
        else return false;
      }

      return answersEnablingFollowUp.includes(values[questionId]);
    }

    return conjunction === 'and'
      ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
      : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
  } catch (error) {
    console.warn(`Error parsing visilbity criteria as JSON, using fallback.
                  \nError message: ${error}
                  \nJSON: ${visibilityCriteria}`);

    return fallbackParseVisibilityCriteria(component, values, allComponents);
  }
}

// set up math context
const math = create(allMath);

export function runCalculations(
  components,
  values,
) {
  const inputValues = { ...values };
  const calculatedValues = {};

  for (const c of components) {
    if (!c.calculation) continue;

    try {
      const value = math.evaluate(c.calculation, inputValues);
      if (Number.isNaN(value)) {
        throw new Error('Value is NaN');
      }
      inputValues[c.dataElement.code] = value;
      calculatedValues[c.dataElement.code] = value.toFixed(2);
    } catch (e) {
      calculatedValues[c.dataElement.code] = null;
    }
  }

  return calculatedValues;
}


function fallbackParseVisibilityCriteria({ visibilityCriteria, dataElement }, values, components) {
  if ([PROGRAM_DATA_ELEMENT_TYPES.RESULT, PROGRAM_DATA_ELEMENT_TYPES.CALCULATED].includes(dataElement.type)) {
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
      return '';
    case PROGRAM_DATA_ELEMENT_TYPES.PATIENT_ISSUE:
      return 'A patient issue will be submitted upon submission of this survey';
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
    default:
      return undefined;
  }
}

export function getConfigObject(componentId, configString) {
  if (!configString) return {};

  try {
    return JSON.parse(configString);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid config in survey screen component ${componentId}`);
    return {};
  }
}

function transformPatientData(patient, config) {
  const { column = 'fullName' } = config;
  const { dateOfBirth, firstName, lastName } = patient;

  switch (column) {
    case 'age':
      return getAgeFromDate(dateOfBirth).toString();
    case 'fullName':
      return joinNames({ firstName, lastName });
    default:
      return patient[column];
  }
}

export function getFormInitialValues(components, patient, currentUser = {}) {
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
    if (component.dataElement.type === 'UserData') {
      const { column = 'displayName' } = config;
      const userValue = currentUser[column];
      if (userValue !== undefined) initialValues[component.dataElement.id] = userValue;
    }

    // patient data
    if (component.dataElement.type === 'PatientData') {
      const patientValue = transformPatientData(patient, config);
      if (patientValue !== undefined) initialValues[component.dataElement.id] = patientValue;
    }
  }

  return initialValues;
}
