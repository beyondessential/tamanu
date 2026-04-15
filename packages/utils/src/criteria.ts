import { inRange } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

const RESERVED_KEYS = ['_conjunction', 'hidden'];

interface Component {
  dataElement?: { code?: string; type?: string };
}

export function checkJSONCriteria(
  criteria: string,
  allComponents: Component[],
  values: Record<string, any>,
): boolean {
  if (!criteria) return true;

  const criteriaObject = JSON.parse(criteria);
  if (!criteriaObject) return true;

  const conjunction = criteriaObject._conjunction;
  delete criteriaObject._conjunction;
  delete criteriaObject.hidden;

  if (Object.keys(criteriaObject).length === 0) return true;

  const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]: [string, any]): boolean => {
    const matchingComponent = allComponents.find(x => x.dataElement?.code === questionCode);
    const value = values[questionCode];
    if (answersEnablingFollowUp.type === 'range') {
      if (!value && value !== 0) return false;
      const { start, end } = answersEnablingFollowUp;

      if (!start) return value < end;
      if (!end) return value >= start;
      if (inRange(parseFloat(value), parseFloat(start), parseFloat(end))) {
        return true;
      }
      return false;
    }

    const isMultiSelect =
      matchingComponent?.dataElement?.type === PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT;

    if (Array.isArray(answersEnablingFollowUp)) {
      return isMultiSelect
        ? (value ? JSON.parse(value) : []).some((selected: string) =>
            answersEnablingFollowUp.includes(selected),
          )
        : answersEnablingFollowUp.includes(value);
    }

    return isMultiSelect
      ? value?.includes(answersEnablingFollowUp)
      : answersEnablingFollowUp === value;
  };

  return conjunction === 'and'
    ? Object.entries(criteriaObject).every(checkIfQuestionMeetsCriteria)
    : Object.entries(criteriaObject).some(checkIfQuestionMeetsCriteria);
}

/**
 * Returns question codes referenced in form visibility criteria JSON.
 * @param visibilityCriteria - JSON string e.g. '{"QUESTION_CODE": "Yes"}'
 */
export function getQuestionCodesFromFormVisibilityCriteria(visibilityCriteria: string): string[] {
  if (!visibilityCriteria || !visibilityCriteria.trim()) return [];
  try {
    const criteria = JSON.parse(visibilityCriteria);
    if (!criteria || typeof criteria !== 'object') return [];
    return Object.keys(criteria).filter(key => !RESERVED_KEYS.includes(key));
  } catch {
    return [];
  }
}

/**
 * Evaluates form-level visibility criteria (same JSON format as question-level visibility).
 * @param criteria - JSON string e.g. '{"QUESTION_CODE": "Yes"}'
 * @param valuesByCode - Map of question code to last answer value
 * @param dataElementTypesByCode - Map of question code to ProgramDataElement type (for multi-select handling)
 */
export function checkFormVisibilityCriteria(
  criteria: string,
  valuesByCode: Record<string, any>,
  dataElementTypesByCode: Record<string, string> = {},
): boolean {
  if (!criteria || !criteria.trim()) return true;
  const allComponents = Object.entries(dataElementTypesByCode).map(([code, type]) => ({
    dataElement: { code, type },
  }));
  return checkJSONCriteria(criteria, allComponents, valuesByCode);
}
