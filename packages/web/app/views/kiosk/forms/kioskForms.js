import { PROGRAM_DATA_ELEMENT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { checkVisibility } from '@tamanu/ui-components';

import { isKioskQuestionType } from './kioskQuestions';

/**
 * Prepares a survey for the kiosk: the questions it shows (current, and of a type the kiosk
 * supports) grouped into pages. Submission date is filled in automatically, so it isn't shown.
 */
export const toKioskForm = survey => {
  const currentComponents = survey.components.filter(
    component => component.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const shownComponents = currentComponents.filter(
    ({ dataElement }) =>
      isKioskQuestionType(dataElement.type) &&
      dataElement.type !== PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE,
  );
  const pageIndexes = [...new Set(shownComponents.map(({ screenIndex }) => screenIndex))].sort(
    (a, b) => a - b,
  );
  return {
    id: survey.id,
    name: survey.name,
    survey,
    currentComponents,
    shownComponents,
    pages: pageIndexes.map(screenIndex =>
      shownComponents.filter(component => component.screenIndex === screenIndex),
    ),
  };
};

export const getVisibleComponents = (components, values, allComponents) =>
  components.filter(component => checkVisibility(component, values, allComponents));

/** The answers to save for a completed form: only the questions the patient could see. */
export const getVisibleAnswers = (form, values) => {
  const visibleIds = new Set(
    getVisibleComponents(form.currentComponents, values, form.currentComponents).map(
      ({ dataElementId }) => dataElementId,
    ),
  );
  return Object.fromEntries(Object.entries(values).filter(([id]) => visibleIds.has(id)));
};
