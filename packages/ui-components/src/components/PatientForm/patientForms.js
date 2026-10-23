import {
  PROGRAM_DATA_ELEMENT_TYPES,
  PROGRAM_REGISTRY_FIELD_LOCATIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

import { checkVisibility } from '../../utils';

/**
 * A patient-data question drawing on the patient's program registration. Patients fill forms in
 * outside any program registry, so there is no registration to draw the value from.
 */
const isProgramRegistryQuestion = ({ dataElement, config }) => {
  if (dataElement.type !== PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA) return false;
  try {
    return PROGRAM_REGISTRY_FIELD_LOCATIONS.includes(JSON.parse(config || '{}').column);
  } catch {
    return false;
  }
};

/**
 * Prepares a survey for a patient to fill in: the questions it shows (current, and of a type the
 * app supports) grouped into pages. Submission date is filled in automatically, so it isn't shown.
 *
 * @param {object} survey With its components
 * @param {(type: string) => boolean} isSupportedQuestionType From `createPatientFormQuestionTypes`
 */
export const toPatientForm = (survey, isSupportedQuestionType) => {
  const currentComponents = survey.components.filter(
    component => component.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const shownComponents = currentComponents.filter(
    component =>
      isSupportedQuestionType(component.dataElement.type) &&
      component.dataElement.type !== PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE &&
      !isProgramRegistryQuestion(component),
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

/**
 * The answers to save for a completed form: the questions the patient could see, plus the
 * submission date filled in for them.
 */
export const getVisibleAnswers = (form, values) => {
  const answeredComponents = form.currentComponents.filter(
    component =>
      form.shownComponents.includes(component) ||
      component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE,
  );
  const visibleIds = new Set(
    getVisibleComponents(answeredComponents, values, form.currentComponents).map(
      ({ dataElementId }) => dataElementId,
    ),
  );
  return Object.fromEntries(Object.entries(values).filter(([id]) => visibleIds.has(id)));
};
