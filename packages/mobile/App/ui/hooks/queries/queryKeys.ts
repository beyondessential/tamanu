import type { QueryKey } from '@tanstack/react-query';

type MaybeId = string | undefined;

export const patientKeys = {
  all: ['patient'] as const satisfies QueryKey,
  detail: (patientId: MaybeId) => [...patientKeys.all, patientId] as const satisfies QueryKey,
  additionalData: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'additionalData'] as const satisfies QueryKey,
  issues: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'issues'] as const satisfies QueryKey,
  encounters: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'encounters'] as const satisfies QueryKey,
  administeredVaccines: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'administeredVaccines'] as const satisfies QueryKey,
  surveyResponses: (patientId: MaybeId, surveyId?: string) =>
    surveyId
      ? ([
          ...patientKeys.detail(patientId),
          'surveyResponses',
          surveyId,
        ] as const satisfies QueryKey)
      : ([...patientKeys.detail(patientId), 'surveyResponses'] as const satisfies QueryKey),
  lastAnswers: (patientId: MaybeId, params: object) =>
    [...patientKeys.detail(patientId), 'lastAnswers', params] as const satisfies QueryKey,
  labRequests: (patientId: MaybeId, params?: object) =>
    [...patientKeys.detail(patientId), 'labRequests', params ?? {}] as const satisfies QueryKey,
  referrals: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'referrals'] as const satisfies QueryKey,
  vitals: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'vitals'] as const satisfies QueryKey,
  registrations: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'registrations'] as const satisfies QueryKey,
  availableRegistries: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'availableRegistries'] as const satisfies QueryKey,
  syncStatus: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'syncStatus'] as const satisfies QueryKey,
  contacts: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'contacts'] as const satisfies QueryKey,
  allergies: (patientId: MaybeId) =>
    [...patientKeys.detail(patientId), 'allergies'] as const satisfies QueryKey,
};

export const patientListKeys = {
  all: ['patients'] as const satisfies QueryKey,
  search: (params: object) =>
    [...patientListKeys.all, 'search', params] as const satisfies QueryKey,
  recentlyViewed: () => [...patientListKeys.all, 'recentlyViewed'] as const satisfies QueryKey,
};

export const surveyKeys = {
  all: ['surveys'] as const satisfies QueryKey,
  list: (params: object) => [...surveyKeys.all, 'list', params] as const satisfies QueryKey,
  detail: (surveyId: string) => [...surveyKeys.all, 'detail', surveyId] as const satisfies QueryKey,
  components: (surveyId: string) =>
    [...surveyKeys.detail(surveyId), 'components'] as const satisfies QueryKey,
  vitalsSurvey: () => [...surveyKeys.all, 'vitalsSurvey'] as const satisfies QueryKey,
  fullResponse: (surveyResponseId: string) =>
    [...surveyKeys.all, 'response', surveyResponseId] as const satisfies QueryKey,
  // config is the raw JSON config string naming the source data element code
  dataElementByCode: (config: string) =>
    [...surveyKeys.all, 'dataElement', config] as const satisfies QueryKey,
};

export const programKeys = {
  all: ['programs'] as const satisfies QueryKey,
  list: () => [...programKeys.all, 'list'] as const satisfies QueryKey,
};

export const registrationKeys = {
  all: ['registrations'] as const satisfies QueryKey,
  detail: (registrationId: MaybeId) =>
    [...registrationKeys.all, registrationId] as const satisfies QueryKey,
  conditions: (registrationId: MaybeId) =>
    [...registrationKeys.detail(registrationId), 'conditions'] as const satisfies QueryKey,
};

export const programRegistryKeys = {
  all: ['programRegistries'] as const satisfies QueryKey,
  list: () => [...programRegistryKeys.all, 'list'] as const satisfies QueryKey,
  conditionCategories: (programRegistryId: string) =>
    [
      ...programRegistryKeys.all,
      programRegistryId,
      'conditionCategories',
    ] as const satisfies QueryKey,
  clinicalStatuses: (programRegistryId: string) =>
    [...programRegistryKeys.all, programRegistryId, 'clinicalStatuses'] as const satisfies QueryKey,
};

export const referenceKeys = {
  all: ['reference'] as const satisfies QueryKey,
  dataByType: (type: string, params?: object) =>
    [...referenceKeys.all, 'data', type, params ?? {}] as const satisfies QueryKey,
  scheduledVaccines: (params: object) =>
    [...referenceKeys.all, 'scheduledVaccines', params] as const satisfies QueryKey,
  patientDataField: (params: object) =>
    [...referenceKeys.all, 'patientDataField', params] as const satisfies QueryKey,
  addressHierarchy: (leafNodeType: string) =>
    [...referenceKeys.all, 'addressHierarchy', leafNodeType] as const satisfies QueryKey,
};

export const patientFieldDefinitionKeys = {
  all: ['patientFieldDefinitions'] as const satisfies QueryKey,
  ids: () => [...patientFieldDefinitionKeys.all, 'ids'] as const satisfies QueryKey,
  detail: (definitionId: string) =>
    [...patientFieldDefinitionKeys.all, definitionId] as const satisfies QueryKey,
};

export const suggestionKeys = {
  all: ['suggestions'] as const satisfies QueryKey,
  list: (suggester: object, params: object) =>
    [...suggestionKeys.all, suggester, 'list', params] as const satisfies QueryKey,
  currentOption: (modelName: string, params: object) =>
    [...suggestionKeys.all, modelName, 'currentOption', params] as const satisfies QueryKey,
};

export const reportKeys = {
  all: ['reports'] as const satisfies QueryKey,
  recentVisitors: (surveyId: string) =>
    [...reportKeys.all, 'recentVisitors', surveyId] as const satisfies QueryKey,
  referralList: () => [...reportKeys.all, 'referralList'] as const satisfies QueryKey,
  encounterSummary: (surveyId: string) =>
    [...reportKeys.all, 'encounterSummary', surveyId] as const satisfies QueryKey,
};

export const syncKeys = {
  all: ['sync'] as const satisfies QueryKey,
  lastSuccessfulPushTick: () =>
    [...syncKeys.all, 'lastSuccessfulPushTick'] as const satisfies QueryKey,
  lastSuccessfulPull: () => [...syncKeys.all, 'lastSuccessfulPull'] as const satisfies QueryKey,
};

export const settingKeys = {
  all: ['settings'] as const satisfies QueryKey,
  byKey: (key: string) => [...settingKeys.all, key] as const satisfies QueryKey,
};
