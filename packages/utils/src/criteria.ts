import { inRange } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES, type DataElementType } from '@tamanu/constants';

const RESERVED_KEYS = ['_conjunction', 'hidden'];

const parsedCriteriaCache = new Map<string, any>();
const componentsByCodeCache = new WeakMap<Component[], Map<string, Component>>();

interface Component {
  dataElement?: { code?: string; type?: DataElementType };
}

function getComponentsByCode(allComponents: Component[]): Map<string, Component> {
  let map = componentsByCodeCache.get(allComponents);
  if (!map) {
    map = new Map(allComponents.map(c => [c.dataElement?.code ?? '', c]));
    componentsByCodeCache.set(allComponents, map);
  }
  return map;
}

type Binaryish = boolean | 'true' | 'false' | 'Yes' | 'No';
type BinaryAnswer = Binaryish | null | undefined;

function isBinaryLikeQuestionType(type: DataElementType | undefined): boolean {
  return type === PROGRAM_DATA_ELEMENT_TYPES.BINARY || type === PROGRAM_DATA_ELEMENT_TYPES.CHECKBOX;
}

function normalizeBinaryAnswer(answer: BinaryAnswer): boolean | null | undefined {
  switch (answer) {
    case true:
    case 'true':
    case 'Yes':
      return true;
    case false:
    case 'false':
    case 'No':
      return false;
    default:
      return answer;
  }
}

/**
 * - Desktop form state uses and persists to database 'true' | 'false'
 * - Mobile persists to database 'Yes' | 'No'
 * - `visibilityCriteria` has historically used 'Yes' | 'No'
 */
function isBinaryishEqual(a: BinaryAnswer, b: BinaryAnswer): boolean {
  return normalizeBinaryAnswer(a) === normalizeBinaryAnswer(b);
}

export function checkJSONCriteria(
  criteria: string,
  allComponents: Component[],
  values: Record<string, any>,
): boolean {
  if (!criteria) return true;

  let criteriaObject = parsedCriteriaCache.get(criteria);
  if (criteriaObject === undefined) {
    criteriaObject = JSON.parse(criteria);
    parsedCriteriaCache.set(criteria, criteriaObject);
  }
  if (!criteriaObject) return true;

  const { _conjunction: conjunction, hidden: _hidden, ...restOfCriteria } = criteriaObject;

  if (Object.keys(restOfCriteria).length === 0) return true;

  const byCode = getComponentsByCode(allComponents);

  const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]: [
    string,
    any,
  ]): boolean => {
    const matchingComponent = byCode.get(questionCode);
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

    const questionType = matchingComponent?.dataElement?.type;
    const isMultiSelect = questionType === PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT;
    const isBinaryLike = isBinaryLikeQuestionType(questionType);

    if (Array.isArray(answersEnablingFollowUp)) {
      if (isMultiSelect) {
        return (value ? JSON.parse(value) : []).some((selected: string) =>
          answersEnablingFollowUp.includes(selected),
        );
      }
      if (isBinaryLike) {
        // For edge cases where `visibilityCriteria` is, say, `{ gate: ["Yes", "No"] }`.
        // i.e. Question with code `gate` has been answered.
        return answersEnablingFollowUp.some(expected => isBinaryishEqual(value, expected));
      }
      return answersEnablingFollowUp.includes(value);
    }

    if (isMultiSelect) return value?.includes(answersEnablingFollowUp);
    if (isBinaryLike) return isBinaryishEqual(value, answersEnablingFollowUp);

    return answersEnablingFollowUp === value;
  };

  return conjunction === 'and'
    ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
    : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
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
  dataElementTypesByCode: Record<string, DataElementType> = {},
): boolean {
  if (!criteria || !criteria.trim()) return true;
  const allComponents = Object.entries(dataElementTypesByCode).map(([code, type]) => ({
    dataElement: { code, type },
  }));
  return checkJSONCriteria(criteria, allComponents, valuesByCode);
}
