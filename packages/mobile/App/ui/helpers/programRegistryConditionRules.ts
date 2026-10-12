import { PROGRAM_REGISTRY_FIELD_LOCATIONS } from '@tamanu/constants';

import type { ISurveyScreenComponent } from '~/types/ISurvey';
import { checkVisibilityCriteria, FieldTypes } from './fields';

export interface ProgramRegistryConditionAnswer {
  conditionId: string;
  categoryId: string | null;
}

export interface ProgramRegistryConditionOptions {
  programRegistry: { id: string; name: string; mandatoryConditionEnabled: boolean } | null;
  conditions: { id: string; name: string }[];
  conditionCategories: { id: string; name: string }[];
  isPatientRegistered: boolean;
  recordedConditionIds: string[];
}

export const parseProgramRegistryConditionAnswer = (
  value: string | ProgramRegistryConditionAnswer | null | undefined,
): ProgramRegistryConditionAnswer | null => {
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
};

const parseConfig = (config: string | undefined) => {
  try {
    return config ? JSON.parse(config) : {};
  } catch {
    return {};
  }
};

const writesProgramRegistration = (components: ISurveyScreenComponent[]) =>
  components.some(
    ({ dataElement, config }) =>
      dataElement.type === FieldTypes.PATIENT_DATA &&
      PROGRAM_REGISTRY_FIELD_LOCATIONS.includes(parseConfig(config).writeToPatient?.fieldName),
  );

export const isProgramRegistryConditionAnswerable = (
  options: ProgramRegistryConditionOptions | undefined,
  components: ISurveyScreenComponent[],
) =>
  Boolean(options?.programRegistry) &&
  (options.isPatientRegistered || writesProgramRegistration(components));

export const isProgramRegistryConditionRequired = (
  options: ProgramRegistryConditionOptions | undefined,
  components: ISurveyScreenComponent[],
) =>
  isProgramRegistryConditionAnswerable(options, components) &&
  options.programRegistry.mandatoryConditionEnabled &&
  options.recordedConditionIds.length === 0 &&
  options.conditions.length > 0;

export const getVisibleConditionQuestions = (
  components: ISurveyScreenComponent[],
  valuesByCode: Record<string, any>,
) =>
  components.filter(
    component =>
      component.dataElement.type === FieldTypes.PROGRAM_REGISTRY_CONDITION &&
      checkVisibilityCriteria(component, components, valuesByCode),
  );

export const getProgramRegistryConditionErrors = (
  components: ISurveyScreenComponent[],
  valuesByCode: Record<string, any>,
  isConditionRequired: boolean,
  requiredMessage: string,
) => {
  const questions = getVisibleConditionQuestions(components, valuesByCode);
  const answers = questions.map(question =>
    parseProgramRegistryConditionAnswer(valuesByCode[question.dataElement.code]),
  );
  const errors: Record<string, string> = {};
  questions.forEach((question, index) => {
    if (answers[index]?.conditionId && !answers[index].categoryId) {
      errors[question.dataElement.code] = requiredMessage;
    }
  });
  if (isConditionRequired && questions.length > 0 && !answers.some(answer => answer?.conditionId)) {
    errors[questions[0].dataElement.code] = requiredMessage;
  }
  return errors;
};
