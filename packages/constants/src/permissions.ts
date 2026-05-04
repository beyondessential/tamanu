import { GENERAL_IMPORTABLE_DATA_TYPES } from './importable';
import { FHIR_INTEGRATION_PERMISSIONS } from './fhir';

const REFERENCE_TYPES_NOUNS = GENERAL_IMPORTABLE_DATA_TYPES.map(
  noun => String(noun).charAt(0).toUpperCase() + String(noun).slice(1),
);

export const PermissionVerb = {
  Manage: 'manage',
  Delete: 'delete',
  Create: 'create',
  Write: 'write',
  List: 'list',
  Read: 'read',
  Run: 'run',
  Submit: 'submit',
  Login: 'login',
  FhirIntegration: 'fhirIntegration',
} as const;

export type PermissionVerb = (typeof PermissionVerb)[keyof typeof PermissionVerb];

const { Manage, Delete, Create, Write, List, Read, Run, Submit, Login, FhirIntegration } = PermissionVerb;

// Verbs allowed at the per-object level for nouns that support objectId.
export const OBJECT_ID_PERMISSION_SCHEMA: Record<string, readonly PermissionVerb[]> = {
  // Charting intentionally includes List and Create at the per-object level so
  // that access can be restricted to specific chart types (identified by objectId).
  Charting: [List, Read, Write, Create, Delete],
  Survey: [Read, Write, Submit],
  StaticReport: [Run],
  ReportDefinition: [Read, Write, Run],
  ProgramRegistry: [Read, Write],
};

export const NOUNS_WITH_OBJECT_ID = Object.keys(OBJECT_ID_PERMISSION_SCHEMA);

// Derived from FHIR_INTEGRATION_PERMISSIONS so the two can never drift apart.
// e.g. { FhirPatient: ['read'], FhirDiagnosticReport: ['read', 'write'], ... }
const FHIR_RESOURCE_PERMISSION_SCHEMA: Record<string, PermissionVerb[]> = {};
for (const config of Object.values(FHIR_INTEGRATION_PERMISSIONS)) {
  for (const noun of config.read) {
    const verbs = (FHIR_RESOURCE_PERMISSION_SCHEMA[noun] ??= []);
    if (!verbs.includes(Read)) verbs.push(Read);
  }
  for (const noun of config.write) {
    const verbs = (FHIR_RESOURCE_PERMISSION_SCHEMA[noun] ??= []);
    if (!verbs.includes(Read)) verbs.push(Read);
    if (!verbs.includes(Write)) verbs.push(Write);
  }
}

// e.g. { PMI: ['fhirIntegration'], LABS: ['fhirIntegration'], ... }
const FHIR_INTEGRATION_NOUN_SCHEMA: Record<string, PermissionVerb[]> = Object.fromEntries(
  Object.keys(FHIR_INTEGRATION_PERMISSIONS).map(k => [k, [FhirIntegration]]),
);

// Display names for nouns that should appear differently in the UI.
// The noun itself (the key) is what gets stored in the database.
export const PERMISSION_NOUN_DISPLAY_NAMES: Partial<Record<string, string>> = Object.fromEntries(
  Object.keys(FHIR_INTEGRATION_NOUN_SCHEMA).map(k => [k, `Integration – ${k}`]), // en dash
);

export const PERMISSION_SCHEMA: Record<string, readonly PermissionVerb[]> = {
  all: [Manage],
  AdministeredVaccine: [List, Read, Write, Create],
  Appointment: [List, Read, Write, Create],
  Asset: [List, Read, Write, Create],
  Attachment: [List, Read, Create],
  CertificateNotification: [Create],
  CertifiableVaccine: [List, Read, Write, Create],
  Charting: [List, Read, Write, Create, Delete],
  Department: [List, Read, Write, Create],
  Discharge: [List, Read, Write, Create],
  DocumentMetadata: [List, Read, Write, Create, Delete],
  Encounter: [List, Read, Write, Create, Delete],
  EncounterDiagnosis: [List, Read, Write, Create],
  EncounterNote: [List, Read, Write, Create],
  Facility: [List, Read, Write, Create, Login],
  ...FHIR_RESOURCE_PERMISSION_SCHEMA,
  ...FHIR_INTEGRATION_NOUN_SCHEMA,
  ImagingAreaExternalCode: [List, Read, Write, Create],
  ImagingRequest: [List, Read, Write, Create],
  ImagingTypeExternalCode: [List, Read, Write, Create],
  Invoice: [List, Read, Write, Create, Delete],
  InvoiceInsurancePlan: [List, Read, Write, Create],
  InvoiceInsurancePlanItem: [List, Read, Write, Create],
  InvoicePayment: [List, Read, Write, Create],
  InvoicePriceList: [List, Read, Write, Create],
  InvoicePriceListItem: [List, Read, Write, Create],
  InvoiceProduct: [List, Read, Write, Create],
  IPSRequest: [Read, Create],
  LabRequest: [List, Read, Write, Create],
  LabRequestLog: [List, Read, Write, Create],
  LabRequestStatus: [Write],
  LabTest: [List, Read, Write, Create],
  LabTestPanel: [List, Read, Write, Create],
  LabTestResult: [List, Read, Write],
  LabTestType: [List, Read, Write, Create],
  Location: [List, Read, Write, Create],
  LocationAssignment: [List, Read],
  LocationGroup: [List, Read, Write, Create],
  LocationSchedule: [List, Read, Write, Create, Delete],
  Medication: [List, Read, Write, Create],
  MedicationAdministration: [List, Read, Write, Create],
  MedicationDispense: [List, Read, Write, Create, Delete],
  MedicationPharmacyNote: [Write, Create],
  MedicationRequest: [List, Read, Write, Create, Delete],
  OtherPractitionerEncounterNote: [Write],
  Patient: [List, Read, Write, Create],
  PatientAllergy: [List, Read, Write, Create],
  PatientBirthData: [Read, Write],
  PatientCarePlan: [List, Read, Write, Create],
  PatientCondition: [List, Read, Write, Create, Delete],
  PatientFieldDefinition: [List, Read, Write, Create],
  PatientFieldDefinitionCategory: [List, Read, Write, Create],
  PatientDeath: [Read, Create],
  PatientDeathData: [Read, Write],
  PatientFamilyHistory: [List, Read, Write, Create],
  PatientIssue: [List, Read, Write, Create],
  PatientLetterTemplate: [List, Read, Write],
  PatientPortalForm: [List, Read, Create, Delete],
  PatientPortalRegistration: [Read, Create],
  PatientProgramRegistration: [List, Read, Write, Create, Delete],
  PatientProgramRegistrationCondition: [List, Read, Write, Create, Delete],
  PatientSecondaryId: [List, Read, Write, Create],
  PatientVaccine: [List, Read, Write, Create],
  Permission: [List, Read, Write, Create, Delete],
  Procedure: [List, Read, Write, Create],
  Program: [List, Read, Write, Create],
  ProgramRegistry: [List, Read, Write],
  ProgramRegistryClinicalStatus: [List, Read, Write],
  ProgramRegistryCondition: [List, Read, Write],
  ProgramRegistryConditionCategory: [List, Read, Write],
  ReferenceData: [List, Read, Write, Create, Delete],
  ReferenceDataRelation: [List, Read, Write, Create],
  Referral: [List, Read, Write, Create, Delete],
  ReportDbSchema: [Write],
  ReportDefinition: [List, Read, Write, Create, Run],
  ReportDefinitionVersion: [List, Read, Write, Create],
  ReportRequest: [List, Read, Write, Create],
  Role: [List, Read, Write, Create, Delete],
  ScheduledVaccine: [List, Read, Write, Create],
  SensitiveLabRequest: [List, Read, Write, Create],
  SensitiveMedication: [List, Read, Write, Create],
  Setting: [List, Read, Write],
  Signer: [List, Read],
  StaticReport: [Run],
  Survey: [List, Read, Write, Create, Submit],
  SurveyResponse: [List, Read, Write, Create, Delete],
  Tasking: [List, Read, Write, Create, Delete],
  Template: [List, Read, Write, Create],
  Translation: [Write],
  TranslatedString: [List, Read, Write],
  TreatmentPlan: [Read, Write],
  TreatmentPlanNote: [Write],
  Triage: [List, Read, Write, Create],
  User: [List, Read, Write, Create],
  UserDesignation: [List, Read, Write, Create],
  Vitals: [List, Read, Write, Create],
};

export const PermissionNoun = Object.fromEntries(
  Object.keys(PERMISSION_SCHEMA).map(noun => [noun, noun]),
) as { readonly [K in keyof typeof PERMISSION_SCHEMA]: K };

export type PermissionNoun = keyof typeof PERMISSION_SCHEMA;

// Includes reference-data sub-types (from importable) in addition to
// PERMISSION_SCHEMA keys. Used for import validation only.
export const PERMISSION_NOUNS = [...REFERENCE_TYPES_NOUNS, ...Object.keys(PERMISSION_SCHEMA)];

export const VERB_ABBREVIATIONS: Record<PermissionVerb, string> = {
  [List]: 'L',
  [Read]: 'R',
  [Write]: 'W',
  [Create]: 'C',
  [Delete]: 'D',
  [Manage]: 'M',
  [Run]: 'X',
  [Submit]: 'S',
  [Login]: 'N',
  [FhirIntegration]: 'F',
};

export const HIDDEN_PERMISSION_NOUNS = new Set([
  PermissionNoun.all,
  ...Object.keys(FHIR_RESOURCE_PERMISSION_SCHEMA),
]);

// Verbs ordered high → low; selecting a verb auto-selects all verbs after it.
// If a verb is not in the hierarchy (eg: Run), it will not be auto-selected when another verb is selected.
export const VERB_HIERARCHY = ['delete', 'create', 'write', 'read', 'list'];

// Canonical left-to-right column order for summary display (L R W C D X S N F).
// Every noun gets the same number of columns so summaries stay aligned.
// `manage` is excluded because its only noun (`all`) is hidden.
export const VERB_DISPLAY_ORDER = ['list', 'read', 'write', 'create', 'delete', 'run', 'submit', 'login', 'fhirIntegration'];
