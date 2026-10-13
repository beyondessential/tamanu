import {
  PROGRAM_DATA_ELEMENT_TYPES,
  PROGRAM_REGISTRY_FIELD_LOCATIONS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { safeJsonParse } from './safeJsonParse';

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

interface ConditionFormComponent {
  dataElement: { code: string; type: string };
  config?: string | null;
  visibilityStatus?: string | null;
}

export const parseProgramRegistryConditionAnswer = (
  value: string | ProgramRegistryConditionAnswer | null | undefined,
): ProgramRegistryConditionAnswer | null => {
  if (!value) return null;
  return typeof value === 'string' ? safeJsonParse(value) : value;
};

const getWriteToPatientFieldName = (config: string | null | undefined) => {
  try {
    return config ? JSON.parse(config).writeToPatient?.fieldName : undefined;
  } catch {
    return undefined;
  }
};

const writesProgramRegistration = (components: ConditionFormComponent[]) =>
  components.some(
    ({ dataElement, config }) =>
      dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA &&
      PROGRAM_REGISTRY_FIELD_LOCATIONS.includes(getWriteToPatientFieldName(config)),
  );

export const isProgramRegistryConditionAnswerable = (
  options: ProgramRegistryConditionOptions | null | undefined,
  components: ConditionFormComponent[],
): options is ProgramRegistryConditionOptions & {
  programRegistry: NonNullable<ProgramRegistryConditionOptions['programRegistry']>;
} =>
  Boolean(options?.programRegistry) &&
  (options!.isPatientRegistered || writesProgramRegistration(components));

export const isProgramRegistryConditionRequired = (
  options: ProgramRegistryConditionOptions | null | undefined,
  components: ConditionFormComponent[],
) =>
  isProgramRegistryConditionAnswerable(options, components) &&
  options.programRegistry.mandatoryConditionEnabled &&
  options.recordedConditionIds.length === 0 &&
  options.conditions.length > 0;

export const getVisibleConditionQuestions = <T extends ConditionFormComponent>(
  components: T[],
  isVisible: (component: T) => boolean,
) =>
  components.filter(
    component =>
      component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PROGRAM_REGISTRY_CONDITION &&
      component.visibilityStatus !== VISIBILITY_STATUSES.HISTORICAL &&
      isVisible(component),
  );

/** Returns the codes of condition questions that fail validation. */
export const getInvalidConditionQuestionCodes = <T extends ConditionFormComponent>(
  components: T[],
  valuesByCode: Record<string, any>,
  isVisible: (component: T) => boolean,
  isConditionRequired: boolean,
) => {
  const questions = getVisibleConditionQuestions(components, isVisible);
  const answers = questions.map(question =>
    parseProgramRegistryConditionAnswer(valuesByCode[question.dataElement.code]),
  );
  const invalidCodes = questions
    .filter((_, index) => answers[index]?.conditionId && !answers[index]?.categoryId)
    .map(question => question.dataElement.code);
  const [firstQuestion] = questions;
  if (isConditionRequired && firstQuestion && !answers.some(answer => answer?.conditionId)) {
    invalidCodes.push(firstQuestion.dataElement.code);
  }
  return [...new Set(invalidCodes)];
};
