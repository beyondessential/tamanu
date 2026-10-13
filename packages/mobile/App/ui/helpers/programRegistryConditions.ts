import { In, IsNull, Not } from 'typeorm';

import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  RegistrationStatus,
} from '~/constants/programRegistries';
import { PatientProgramRegistration } from '~/models/PatientProgramRegistration';
import { PatientProgramRegistrationCondition } from '~/models/PatientProgramRegistrationCondition';
import { ProgramRegistry } from '~/models/ProgramRegistry';
import { ProgramRegistryCondition } from '~/models/ProgramRegistryCondition';
import { ProgramRegistryConditionCategory } from '~/models/ProgramRegistryConditionCategory';
import type { ISurveyScreenComponent } from '~/types/ISurvey';
import { VisibilityStatus } from '~/visibilityStatuses';
import {
  getVisibleConditionQuestions,
  parseProgramRegistryConditionAnswer,
  type ProgramRegistryConditionOptions,
} from './programRegistryConditionRules';

const getCurrentProgramRegistry = (surveyId: string) =>
  ProgramRegistry.findOne({
    where: { program: { surveys: { id: surveyId } }, visibilityStatus: VisibilityStatus.Current },
  });

const getActiveRegistration = async (programId: string, patientId: string) => {
  const registration = await PatientProgramRegistration.getRecentOne(programId, patientId);
  return registration?.registrationStatus === RegistrationStatus.Active ? registration : null;
};

const getRecordedConditionIds = async (patientProgramRegistrationId: string) => {
  const conditions = await PatientProgramRegistrationCondition.find({
    where: {
      patientProgramRegistration: { id: patientProgramRegistrationId },
      deletionDate: IsNull(),
      programRegistryConditionCategory: {
        code: Not(PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR),
      },
    },
  });
  return conditions.map(condition => condition.programRegistryConditionId);
};

export const getProgramRegistryConditionOptions = async (
  surveyId: string,
  patientId: string,
): Promise<ProgramRegistryConditionOptions> => {
  const programRegistry = await getCurrentProgramRegistry(surveyId);
  if (!programRegistry) {
    return {
      programRegistry: null,
      conditions: [],
      conditionCategories: [],
      isPatientRegistered: false,
      recordedConditionIds: [],
    };
  }

  const conditions = await ProgramRegistryCondition.find({
    where: {
      programRegistry: { id: programRegistry.id },
      visibilityStatus: VisibilityStatus.Current,
    },
    order: { name: 'ASC' },
  });
  const conditionCategories = await ProgramRegistryConditionCategory.find({
    where: {
      programRegistry: { id: programRegistry.id },
      visibilityStatus: VisibilityStatus.Current,
      code: Not(PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR),
    },
    order: { name: 'ASC' },
  });
  const registration = await getActiveRegistration(programRegistry.programId, patientId);

  return {
    programRegistry: {
      id: programRegistry.id,
      name: programRegistry.name,
      mandatoryConditionEnabled: programRegistry.mandatoryConditionEnabled,
    },
    conditions: conditions.map(({ id, name }) => ({ id, name })),
    conditionCategories: conditionCategories.map(({ id, name }) => ({ id, name })),
    isPatientRegistered: Boolean(registration),
    recordedConditionIds: registration ? await getRecordedConditionIds(registration.id) : [],
  };
};

/**
 * DUPLICATED IN database/src/models/SurveyResponse.ts. Please keep in sync.
 */
export async function addProgramRegistryConditions(
  components: ISurveyScreenComponent[],
  valuesByCode: Record<string, any>,
  patientId: string,
  surveyId: string,
  userId: string,
  submittedTime: string,
) {
  const conditionAnswers = getVisibleConditionQuestions(components, valuesByCode)
    .map(question => parseProgramRegistryConditionAnswer(valuesByCode[question.dataElement.code]))
    .filter(answer => answer?.conditionId);
  if (conditionAnswers.length === 0) return;

  const programRegistry = await getCurrentProgramRegistry(surveyId);
  if (!programRegistry) {
    throw new Error('No program registry configured for the current form');
  }
  const conditionIds = [...new Set(conditionAnswers.map(answer => answer.conditionId))];
  const categoryIds = [
    ...new Set(conditionAnswers.map(answer => answer.categoryId).filter(Boolean)),
  ];
  const registryConditionCount = await ProgramRegistryCondition.count({
    where: { id: In(conditionIds), programRegistry: { id: programRegistry.id } },
  });
  const registryCategoryCount = await ProgramRegistryConditionCategory.count({
    where: { id: In(categoryIds), programRegistry: { id: programRegistry.id } },
  });
  if (
    registryConditionCount !== conditionIds.length ||
    registryCategoryCount !== categoryIds.length
  ) {
    throw new Error(
      "A related condition or category does not belong to this form's program registry",
    );
  }

  const registration = await getActiveRegistration(programRegistry.programId, patientId);
  if (!registration) return;

  const recordedConditionIds = new Set(await getRecordedConditionIds(registration.id));
  for (const { conditionId, categoryId } of conditionAnswers) {
    if (recordedConditionIds.has(conditionId)) continue;
    if (!categoryId) {
      throw new Error('A related condition needs a category');
    }
    await PatientProgramRegistrationCondition.createAndSaveOne({
      patientProgramRegistration: registration.id,
      programRegistryCondition: conditionId,
      programRegistryConditionCategory: categoryId,
      date: submittedTime,
      clinician: userId,
    });
    recordedConditionIds.add(conditionId);
  }
}
