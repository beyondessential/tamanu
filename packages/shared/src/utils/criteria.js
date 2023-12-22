import { inRange } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';

export function checkJSONCriteria(criteria, allComponents, values) {
  // nothing set - show by default
  if (!criteria) return true;

  const criteriaObject = JSON.parse(criteria);

  if (!criteriaObject) {
    return true;
  }

  const { _conjunction: conjunction, hidden: _, ...restOfCriteria } = criteriaObject;
  if (Object.keys(restOfCriteria).length === 0) {
    return true;
  }

  const checkIfQuestionMeetsCriteria = ([questionCode, answersEnablingFollowUp]) => {
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
        ? (JSON.parse(value) || []).some(selected => answersEnablingFollowUp.includes(selected))
        : answersEnablingFollowUp.includes(value);
    }

    return isMultiSelect
      ? value?.includes(answersEnablingFollowUp)
      : answersEnablingFollowUp === value;
  };

  return conjunction === 'and'
    ? Object.entries(restOfCriteria).every(checkIfQuestionMeetsCriteria)
    : Object.entries(restOfCriteria).some(checkIfQuestionMeetsCriteria);
}
