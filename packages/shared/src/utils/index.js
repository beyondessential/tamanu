export * from './buildVersionCompatibilityCheck';
export * from './getMetaServerHosts';
export * from './getPatientAdditionalData';
export * from './getPatientSurveyResponseAnswer';
export * from './getResponseJsonSafely';
export * from './stringToStableInteger';
export * from './uuidToFairlyUniqueInteger';
export * from './patientAccessors';
export * from './tmpdir';

export * from './valueIndex';
export * from './withConfig';
export * from './dischargeOutpatientEncounters';
export * from './getCovidClearanceCertificateFilter';
export * from './getLabTestsFromLabRequests';
export * from './numeralTranslation';
export * from './enumRegistry';
export * from './medication';
export * from './initDeviceId';
export * from './errorHandlerProblem';
// Note: ./crypto is intentionally NOT exported from this barrel. It pulls in
// Node-only deps (fs, config, read, commander) and CLI actions, which would
// bloat or break browser bundles (web, mobile) that consume this barrel.
// Server-side callers should deep-import from '@tamanu/shared/utils/crypto'.
//
// Likewise ./patientCertificates, ./patientLetters and ./handoverNotes are NOT
// exported here: they pull in @react-pdf/renderer, which initialises Yoga at
// module-eval time and throws under native ESM when a barrel consumer (e.g. a
// database model loaded by the tsx loader during migrations) only wanted an
// unrelated util. Consumers should deep-import from the relevant submodule, e.g.
// '@tamanu/shared/utils/patientCertificates'.
