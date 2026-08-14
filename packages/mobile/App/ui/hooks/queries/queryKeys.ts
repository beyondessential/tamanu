/**
 * Query key factories for the whole app (TkDodo-style: array keys, generic to specific).
 *
 * All data for one patient lives under the ['patient', patientId] prefix so that
 * mutations can cheaply invalidate everything about a patient with
 * queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) }).
 *
 * This module is deliberately shared (rather than colocated) because invalidation
 * crosses feature modules: a survey submission invalidates patient history, program
 * registrations, and report queries at once.
 */

export const patientKeys = {
  all: ['patient'] as const,
  detail: (patientId: string) => [...patientKeys.all, patientId] as const,
  additionalData: (patientId: string) =>
    [...patientKeys.detail(patientId), 'additionalData'] as const,
  fieldValues: (patientId: string) => [...patientKeys.detail(patientId), 'fieldValues'] as const,
  issues: (patientId: string) => [...patientKeys.detail(patientId), 'issues'] as const,
  encounters: (patientId: string) => [...patientKeys.detail(patientId), 'encounters'] as const,
  administeredVaccines: (patientId: string) =>
    [...patientKeys.detail(patientId), 'administeredVaccines'] as const,
  surveyResponses: (patientId: string, surveyId?: string) =>
    surveyId
      ? ([...patientKeys.detail(patientId), 'surveyResponses', surveyId] as const)
      : ([...patientKeys.detail(patientId), 'surveyResponses'] as const),
  lastAnswers: (patientId: string, params: object) =>
    [...patientKeys.detail(patientId), 'lastAnswers', params] as const,
  labRequests: (patientId: string, params?: object) =>
    [...patientKeys.detail(patientId), 'labRequests', params ?? {}] as const,
  referrals: (patientId: string) => [...patientKeys.detail(patientId), 'referrals'] as const,
  vitals: (patientId: string) => [...patientKeys.detail(patientId), 'vitals'] as const,
  registrations: (patientId: string) =>
    [...patientKeys.detail(patientId), 'registrations'] as const,
  availableRegistries: (patientId: string) =>
    [...patientKeys.detail(patientId), 'availableRegistries'] as const,
  syncStatus: (patientId: string) => [...patientKeys.detail(patientId), 'syncStatus'] as const,
  contacts: (patientId: string) => [...patientKeys.detail(patientId), 'contacts'] as const,
};

export const patientListKeys = {
  all: ['patients'] as const,
  search: (params: object) => [...patientListKeys.all, 'search', params] as const,
  recentlyViewed: () => [...patientListKeys.all, 'recentlyViewed'] as const,
};

export const surveyKeys = {
  all: ['surveys'] as const,
  list: (params: object) => [...surveyKeys.all, 'list', params] as const,
  detail: (surveyId: string) => [...surveyKeys.all, 'detail', surveyId] as const,
  components: (surveyId: string) => [...surveyKeys.detail(surveyId), 'components'] as const,
  vitalsSurvey: () => [...surveyKeys.all, 'vitalsSurvey'] as const,
  fullResponse: (surveyResponseId: string) =>
    [...surveyKeys.all, 'response', surveyResponseId] as const,
};

export const programKeys = {
  all: ['programs'] as const,
  list: () => [...programKeys.all, 'list'] as const,
};

export const registrationKeys = {
  all: ['registrations'] as const,
  detail: (registrationId: string) => [...registrationKeys.all, registrationId] as const,
  conditions: (registrationId: string) =>
    [...registrationKeys.detail(registrationId), 'conditions'] as const,
};

export const programRegistryKeys = {
  all: ['programRegistries'] as const,
  list: () => [...programRegistryKeys.all, 'list'] as const,
  conditions: (programRegistryId: string, params?: object) =>
    [...programRegistryKeys.all, programRegistryId, 'conditions', params ?? {}] as const,
  conditionCategories: (programRegistryId: string) =>
    [...programRegistryKeys.all, programRegistryId, 'conditionCategories'] as const,
};

export const referenceKeys = {
  all: ['reference'] as const,
  dataByType: (type: string, params?: object) =>
    [...referenceKeys.all, 'data', type, params ?? {}] as const,
  hierarchyAncestors: (entityId: string) =>
    [...referenceKeys.all, 'hierarchyAncestors', entityId] as const,
  scheduledVaccines: (params: object) =>
    [...referenceKeys.all, 'scheduledVaccines', params] as const,
  facility: (facilityId: string) => [...referenceKeys.all, 'facility', facilityId] as const,
};

export const suggestionKeys = {
  all: ['suggestions'] as const,
  // one namespace per suggestible model; params carries filters/search/language
  list: (modelName: string, params: object) =>
    [...suggestionKeys.all, modelName, 'list', params] as const,
  currentOption: (modelName: string, params: object) =>
    [...suggestionKeys.all, modelName, 'currentOption', params] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  recentVisitors: (surveyId: string) => [...reportKeys.all, 'recentVisitors', surveyId] as const,
  referralList: () => [...reportKeys.all, 'referralList'] as const,
  encounterSummary: (surveyId: string) =>
    [...reportKeys.all, 'encounterSummary', surveyId] as const,
};

export const attachmentKeys = {
  all: ['attachments'] as const,
  detail: (attachmentId: string) => [...attachmentKeys.all, attachmentId] as const,
};
