import { create, all as allMath } from 'mathjs';

import {
  TextField,
  MultilineTextField,
  SelectField,
  MultiselectField,
  DateField,
  NullableBooleanField,
  AutocompleteField,
  NumberField,
} from 'desktop/app/components/Field';

export const SURVEY_FIELD_TYPES = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  MULTI_SELECT: 'MultiSelect',
  AUTOCOMPLETE: 'Autocomplete',
  DATE: 'Date',
  SUBMISSION_DATE: 'SubmissionDate',
  INSTRUCTION: 'Instruction',
  NUMBER: 'Number',
  BINARY: 'Binary',
  CHECKBOX: 'Checkbox',
  CALCULATED: 'CalculatedQuestion',
  CONDITION: 'ConditionQuestion',
  RESULT: 'Result',
  SURVEY_ANSWER: 'SurveyAnswer',
  SURVEY_RESULT: 'SurveyResult',
  SURVEY_LINK: 'SurveyLink',
};

export const QUESTION_COMPONENTS = {
  [SURVEY_FIELD_TYPES.TEXT]: TextField,
  [SURVEY_FIELD_TYPES.MULTILINE]: MultilineTextField,
  [SURVEY_FIELD_TYPES.RADIO]: SelectField, // TODO: Implement proper radio field.
  [SURVEY_FIELD_TYPES.SELECT]: SelectField,
  [SURVEY_FIELD_TYPES.MULTI_SELECT]: MultiselectField,
  [SURVEY_FIELD_TYPES.AUTOCOMPLETE]: AutocompleteField,
  [SURVEY_FIELD_TYPES.DATE]: DateField,
  [SURVEY_FIELD_TYPES.SUBMISSION_DATE]: DateField,
  [SURVEY_FIELD_TYPES.NUMBER]: NumberField,
  [SURVEY_FIELD_TYPES.BINARY]: NullableBooleanField,
  [SURVEY_FIELD_TYPES.CHECKBOX]: NullableBooleanField,
  // [SURVEY_FIELD_TYPES.CALCULATED]: ReadOnlyField,
  // [SURVEY_FIELD_TYPES.SURVEY_LINK]: SurveyLink,
  // [SURVEY_FIELD_TYPES.SURVEY_RESULT]: SurveyResult,
  // [SURVEY_FIELD_TYPES.SURVEY_ANSWER]: SurveyAnswerField,
  [SURVEY_FIELD_TYPES.INSTRUCTION]: null,
  // [SURVEY_FIELD_TYPES.RESULT]: null,
};

export function mapOptionsToValues(options) {
  if (!options) return null;
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
        if (inRange(value, parseFloat(start), parseFloat(end))) {
          return true;
        }
      }

      return answersEnablingFollowUp.includes(values[questionId]);
    }

    return conjunction === 'and'
      ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
      : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
  } catch(error) {
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

  for(const c of components) {
    if(!c.calculation) continue;

    try {
      const value = math.evaluate(c.calculation, inputValues);
      if(Number.isNaN(value)) {
        throw new Error('Value is NaN');
      }
      inputValues[c.dataElement.code] = value;
      calculatedValues[c.dataElement.code] = value.toFixed(2);
    } catch(e) {
      calculatedValues[c.dataElement.code] = null;
    }
  }

  return calculatedValues;
}


function fallbackParseVisibilityCriteria({ visibilityCriteria, dataElement }, values, components) {
  if ([SURVEY_FIELD_TYPES.RESULT, SURVEY_FIELD_TYPES.CALCULATED].includes(dataElement.type)) {
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
