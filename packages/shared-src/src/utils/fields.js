import { inRange } from 'lodash';
import { log } from '../services/logging';
import { PROGRAM_DATA_ELEMENT_TYPES } from '../constants/surveys';

export function getStringValue(type, value) {
  if (value === null) {
    return null;
  }
  switch (type) {
    case PROGRAM_DATA_ELEMENT_TYPES.CALCULATED:
      return value.toFixed(1);
    default:
      return `${value}`;
  }
}

function compareData(dataType, expected, given) {
  switch (dataType) {
    case PROGRAM_DATA_ELEMENT_TYPES.BINARY:
      if (expected === 'yes' && given === true) return true;
      if (expected === 'no' && given === false) return true;
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.NUMBER:
    case PROGRAM_DATA_ELEMENT_TYPES.CALCULATED: {
      // we check within a threshold because strict equality is actually pretty rare
      const parsed = parseFloat(expected);
      const diff = Math.abs(parsed - given);

      const threshold = 0.05; // TODO: configurable
      if (diff < threshold) return true;
      break;
    }
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      return given.split(', ').includes(expected);
    default:
      if (expected === given) return true;
      break;
  }

  return false;
}

function checkVisibilityCriteria(component, allComponents, values) {
  const { visibilityCriteria } = component;
  // nothing set - show by default
  if (!visibilityCriteria) return true;

  try {
    const criteriaObject = JSON.parse(visibilityCriteria);

    if (!criteriaObject) {
      return true;
    }

    const { _conjunction: conjunction, hidden: _, ...restOfCriteria } = criteriaObject;
    if (Object.keys(restOfCriteria).length === 0) {
      return true;
    }

    const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]) => {
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
      if (matchingComponent?.dataElement?.type === 'MultiSelect') {
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
    log.warn(
      `Error parsing JSON visibility criteria for ${component.dataElement?.code}, using fallback.\nError message: ${error.message}`,
    );

    return fallbackParseVisibilityCriteria(visibilityCriteria, values, allComponents);
  }
}

/**
 * Meditrak uses JSON for these fields now, whereas we have been using colon separated values.
 * Our goal is to have the same syntax as Meditrak for surveys, but since we already have some
 * test surveys out there using our old system, we fall back to it if we can't parse the JSON.
 * TODO: Remove the fallback once we can guarantee that there's no surveys using it.
 */
function fallbackParseVisibilityCriteria(visibilityCriteria, values, allComponents) {
  const [elementCode = '', expectedAnswer = ''] = visibilityCriteria.split(/\s*:\s*/);

  let givenAnswer = values[elementCode] || '';
  if (givenAnswer.toLowerCase) {
    givenAnswer = givenAnswer.toLowerCase().trim();
  }
  const expectedTrimmed = expectedAnswer.toLowerCase().trim();

  const comparisonComponent = allComponents.find(x => x.dataElement.code === elementCode);

  if (!comparisonComponent) {
    log.warn(`Comparison component ${elementCode} not found!`);
    return false;
  }

  const comparisonDataType = comparisonComponent.dataElement.type;

  return compareData(comparisonDataType, expectedTrimmed, givenAnswer);
}

export function getResultValue(components, values) {
  const resultComponents = components
    .filter(c => c.dataElement.type === 'Result')
    .filter(c => checkVisibilityCriteria(c, components, values));

  const component = resultComponents.pop();

  if (!component) {
    return { result: 0, resultText: '' };
  }

  const rawValue = values[component.dataElement.id];

  if (rawValue === undefined || rawValue === null || Number.isNaN(rawValue)) {
    return { result: 0, resultText: component.detail || '' };
  }

  if (typeof rawValue === 'string') {
    return { result: 0, resultText: rawValue };
  }

  return {
    result: rawValue,
    resultText: `${rawValue.toFixed(0)}%`,
  };
}
