import { inRange } from 'lodash';
import { formatISO9075 } from 'date-fns';
import { ISurveyScreenComponent, DataElementType } from '~/types/ISurvey';
import { AutocompleteSourceToColumnMap } from '~/ui/helpers/constants';
import { Database } from '~/infra/db/index';

export const FieldTypes = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  MULTI_SELECT: 'MultiSelect',
  AUTOCOMPLETE: 'Autocomplete',
  DATE: 'Date',
  DATE_TIME: 'DateTime',
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
  PATIENT_DATA: 'PatientData',
  USER_DATA: 'UserData',
  PHOTO: 'Photo',
  PATIENT_ISSUE_GENERATOR: 'PatientIssueGenerator',
};

export const getBodyId = (c: ISurveyScreenComponent, value: unknown): string | null => {
  if (c.dataElement.type === FieldTypes.AUTOCOMPLETE && typeof value === 'string') {
    return value;
  }
  return null;
};

export const getBodyValue = async (c: ISurveyScreenComponent, value: unknown): Promise<string | null> => {
  const config = c.getConfigObject();
  let fieldType: string = c.dataElement.type;
  if (fieldType === FieldTypes.PATIENT_DATA) {
    fieldType = config?.writeToPatient?.fieldType || fieldType;
  }
  switch (fieldType) {
    case FieldTypes.TEXT:
    case FieldTypes.MULTILINE:
      if (typeof value === 'string') {
        return value;
      }
      return null;
    case FieldTypes.DATE:
    case FieldTypes.SUBMISSION_DATE:
      if (c.dataElement.type === FieldTypes.PATIENT_DATA && typeof value === 'string') {
        return `${value}`; // TODO: PatientData relies on an exact being passed from the patient if there's nothing selected in the datepicker
      }
      return value ? formatISO9075(value) : null;
    case FieldTypes.BINARY:
    case FieldTypes.CHECKBOX:
      if (typeof value === 'string') return value;
      // booleans should all be stored as Yes/No to match meditrak
      return value ? 'Yes' : 'No';
    case FieldTypes.CALCULATED:
      if (typeof value === 'number') {
        // TODO: configurable precision on calculated fields
        return value.toFixed(1);
      }
      return `${value}`;
    case FieldTypes.AUTOCOMPLETE:
      let model: any;
      let columnName: string;
      try {
        const { source } = config;
        if (!source) throw new Error('missing config.source');
        columnName = AutocompleteSourceToColumnMap[source];
        if (!columnName) throw new Error('missing columnName mapping for config.source');
        model = Database.models[source];
        if (!model) throw new Error('unable to find model from config.source');
      } catch (e) {
        throw new Error(`Invalid configuration for component ${c.id}, please contact your helpdesk or system administrator\n$Original: {e.message}`);
      }
      if (!value) {
        /*
         * Check value after config validation so it's harder to miss an invalid
         * survey config during testing.
         */
        return null;
      }
      const record = await model.findOne({ id: value });
      if (!record) {
        return null;
      }
      const name = record[columnName];
      if (typeof name !== 'string') {
        return null;
      }
      return name;
    default:
      return `${value}`;
  }
};

export function isCalculated(fieldType: string): boolean {
  switch (fieldType) {
    case FieldTypes.PATIENT_ISSUE_GENERATOR:
    case FieldTypes.CALCULATED:
    case FieldTypes.RESULT:
      return true;
    default:
      return false;
  }
}

interface DropdownOption {
  label: string;
  value: any;
}

// Takes an object and returns the key:value pairs as options for dropdown fields.
export function createDropdownOptionsFromObject(o): DropdownOption[] {
  return Object.entries(o).map(([key, value]) => ({ label: key, value }));
}

function compareData(dataType: string, expected: string, given: any): boolean {
  switch (dataType) {
    case FieldTypes.BINARY:
      if (expected === 'yes' && given === true) return true;
      if (expected === 'no' && given === false) return true;
      break;
    case FieldTypes.NUMBER:
    case FieldTypes.CALCULATED: {
      // we check within a threshold because strict equality is actually pretty rare
      const parsed = parseFloat(expected);
      const diff = Math.abs(parsed - given);

      const threshold = 0.05; // TODO: configurable
      if (diff < threshold) return true;
      break;
    }
    case FieldTypes.MULTI_SELECT:
      return given.split(', ').includes(expected);
    default:
      if (expected === given) return true;
      break;
  }

  return false;
}

/**
 * Meditrak uses JSON for these fields now, whereas we have been using colon separated values.
 * Our goal is to have the same syntax as Meditrak for surveys, but since we already have some
 * test surveys out there using our old system, we fall back to it if we can't parse the JSON.
 * TODO: Remove the fallback once we can guarantee that there's no surveys using it.
 */
function fallbackParseVisibilityCriteria(visibilityCriteria, values, allComponents): boolean {
  const [elementCode = '', expectedAnswer = ''] = visibilityCriteria.split(/\s*:\s*/);

  let givenAnswer = values[elementCode] || '';
  if (givenAnswer.toLowerCase) {
    givenAnswer = givenAnswer.toLowerCase().trim();
  }
  const expectedTrimmed = expectedAnswer.toLowerCase().trim();

  const comparisonComponent = allComponents.find(x => x.dataElement.code === elementCode);

  if (!comparisonComponent) {
    console.warn(`Comparison component ${elementCode} not found!`);
    return false;
  }

  const comparisonDataType = comparisonComponent.dataElement.type;

  return compareData(comparisonDataType, expectedTrimmed, givenAnswer);
}

/**
 * IMPORTANT: We also have another version of this method in sync-server
 * sub commands 'calculateSurveyResults'.
 * The sub command is for recalculate survey results due to an issue that
 * resultText was not synced properly to sync-server before.
 * So if there is an update to this method, please make the same update
 * in the other version in sync-server
 */
export function checkVisibilityCriteria(
  component: ISurveyScreenComponent,
  allComponents: ISurveyScreenComponent[],
  values: any,
): boolean {
  const { visibilityCriteria } = component;
  // nothing set - show by default
  if (!visibilityCriteria) return true;

  try {
    const criteriaObject = JSON.parse(visibilityCriteria);

    if (!criteriaObject) {
      return true;
    }

    const { _conjunction: conjunction, ...restOfCriteria } = criteriaObject;
    if (Object.keys(restOfCriteria).length === 0) {
      return true;
    }

    const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]): boolean => {
      const value = values[questionCode];
      if (answersEnablingFollowUp.type === 'range') {
        if (!value) return false;
        const { start, end } = answersEnablingFollowUp;

        if (!start) return value < end;
        if (!end) return value >= start;
        if (inRange(value, parseFloat(start), parseFloat(end))) {
          return true;
        }
      }

      const matchingComponent = allComponents.find(x => x.dataElement?.code === questionCode);
      if (matchingComponent?.dataElement?.type === DataElementType.MultiSelect) {
        const givenValues = values[questionCode].split(', ');
        return givenValues.includes(answersEnablingFollowUp);
      }

      if (Array.isArray(answersEnablingFollowUp)) {
        return answersEnablingFollowUp.includes(value);
      }
      return answersEnablingFollowUp === value;
    };

    return conjunction === 'and'
      ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
      : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
  } catch (error) {
    console.warn(`Error parsing JSON visilbity criteria, using fallback.
                  \nError message: ${error}`);

    return fallbackParseVisibilityCriteria(visibilityCriteria, values, allComponents);
  }
}

// also exists on desktop
export function shouldSaveComponent(
  component: ISurveyScreenComponent,
  allComponents: ISurveyScreenComponent[],
  values: object,
): boolean {
  const config = component.getConfigObject();
  const isVisible = checkVisibilityCriteria(component, allComponents, values);
  // eslint-disable-next-line no-unneeded-ternary
  const shouldPersist = !config['omitFromResult'];
  return isVisible && shouldPersist;
}

interface ResultValue {
  result: number;
  resultText: string;
}

/**
 * IMPORTANT: We also have another version of this method in sync-server
 * sub commands 'calculateSurveyResults'.
 * The sub command is for recalculate survey results due to an issue that
 * resultText was not synced properly to sync-server before.
 * So if there is an update to this method, please make the same update
 * in the other version in sync-server
 */
export function getResultValue(allComponents: ISurveyScreenComponent[], values: {}): ResultValue {
  // find a component with a Result data type and use its value as the overall result
  const resultComponents = allComponents
    .filter(c => c.dataElement.type === DataElementType.Result)
    .filter(c => checkVisibilityCriteria(c, allComponents, values));

  // use the last visible component in the array
  const component = resultComponents.pop();

  if (!component) {
    // this survey does not have a result field
    return { result: 0, resultText: '' };
  }

  const rawValue = values[component.dataElement.code];

  // invalid values just get empty results
  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return { result: 0, resultText: component.detail || '' };
  }

  // string values just get passed on directly
  if (typeof rawValue === 'string') {
    return { result: 0, resultText: rawValue };
  }

  // numeric data gets formatted
  return {
    result: rawValue,
    resultText: `${rawValue.toFixed(0)}%`,
  };
}
