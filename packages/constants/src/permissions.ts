import { GENERAL_IMPORTABLE_DATA_TYPES } from './importable';

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
} as const;

export type PermissionVerb = (typeof PermissionVerb)[keyof typeof PermissionVerb];

const { Manage, Delete, Create, Write, List, Read, Run, Submit } = PermissionVerb;

// Verbs allowed at the per-object level for nouns that support objectId.
export const OBJECT_ID_PERMISSION_SCHEMA: Record<string, readonly PermissionVerb[]> = {
  Charting: [List, Read, Write, Create, Delete],
  Survey: [Read, Write, Submit],
  StaticReport: [Run],
  ReportDefinition: [Read, Write, Run],
  ProgramRegistry: [Read],
};

export const NOUNS_WITH_OBJECT_ID = Object.keys(OBJECT_ID_PERMISSION_SCHEMA);

export const PERMISSION_SCHEMA: Record<string, readonly PermissionVerb[]> = {
  all: [Manage],
  Appointment: [List, Read, Write, Create],
  Asset: [Write, Create],
  Attachment: [Read, Create],
  CertificateNotification: [Create],
  Charting: [List, Read, Write, Create, Delete],
  Department: [List, Read],
  Discharge: [Read, Write],
  DocumentMetadata: [List, Read, Write, Create, Delete],
  Encounter: [List, Read, Write, Create, Delete],
  EncounterDiagnosis: [List, Read, Write, Create],
  EncounterNote: [List, Read, Write, Create],
  Facility: [List, Read],
  ImagingRequest: [List, Read, Write, Create],
  Invoice: [List, Read, Write, Create, Delete],
  InvoiceInsurancePlan: [List, Create],
  InvoicePayment: [List, Write, Create],
  InvoiceProduct: [List, Create],
  IPSRequest: [Create],
  LabRequest: [List, Read, Write, Create],
  LabRequestLog: [List],
  LabRequestStatus: [Write],
  LabTest: [List, Read, Write],
  LabTestPanel: [List, Read],
  LabTestResult: [Read, Write],
  LabTestType: [List],
  Location: [List, Read, Write, Create],
  LocationAssignment: [List, Read],
  LocationGroup: [List, Read, Write, Create],
  LocationSchedule: [List, Read, Write, Create, Delete],
  Medication: [List, Read, Write, Create],
  MedicationAdministration: [List, Read, Write, Create],
  MedicationDispense: [Read, Write, Create, Delete],
  MedicationPharmacyNote: [Write, Create],
  MedicationRequest: [Read, Create, Delete],
  OtherPractitionerEncounterNote: [Write],
  Patient: [List, Read, Write, Create],
  PatientAllergy: [List, Read, Write, Create],
  PatientCarePlan: [List, Read, Write, Create],
  PatientCondition: [List, Read, Write, Create, Delete],
  PatientDeath: [Read, Create],
  PatientFamilyHistory: [List, Read, Write, Create],
  PatientIssue: [List, Read, Write, Create],
  PatientPortalForm: [List, Create, Delete],
  PatientPortalRegistration: [Read, Create],
  PatientProgramRegistration: [List, Read, Write, Create, Delete],
  PatientProgramRegistrationCondition: [List, Read, Write, Create],
  PatientSecondaryId: [Write, Create],
  PatientVaccine: [List, Read, Write, Create],
  Permission: [Read, Create, Delete],
  Procedure: [List, Read, Create],
  Program: [List, Read, Write, Create],
  ProgramRegistry: [List, Read],
  ProgramRegistryClinicalStatus: [List],
  ProgramRegistryCondition: [List],
  ProgramRegistryConditionCategory: [List],
  ReferenceData: [List, Read, Write, Create],
  Referral: [Read, Write, Create, Delete],
  ReportDbSchema: [Write],
  ReportDefinition: [List, Read, Write, Create, Run],
  ReportDefinitionVersion: [Read, Create],
  Role: [List, Create, Delete],
  SensitiveLabRequest: [List, Read, Write, Create],
  SensitiveMedication: [List, Read, Write, Create],
  Setting: [Read, Write],
  StaticReport: [Run],
  Survey: [List, Read, Write, Create, Submit],
  SurveyResponse: [List, Read, Create, Delete],
  Tasking: [List, Read, Write, Create, Delete],
  Template: [List, Read, Write, Create],
  Translation: [Write],
  TreatmentPlanNote: [Write],
  Triage: [List, Read, Create],
  User: [List, Read, Write, Create],
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
};

export const HIDDEN_PERMISSION_NOUNS = new Set([PermissionNoun.all]);

// Verbs ordered high → low; selecting a verb auto-selects all verbs after it.
// If a verb is not in the hierarchy (eg: Run), it will not be auto-selected when another verb is selected.
export const VERB_HIERARCHY = ['delete', 'create', 'write', 'read', 'list'];

// Canonical left-to-right column order for summary display (L R W C D X S).
// Every noun gets the same number of columns so summaries stay aligned.
// `manage` is excluded because its only noun (`all`) is hidden.
export const VERB_DISPLAY_ORDER = ['list', 'read', 'write', 'create', 'delete', 'run', 'submit'];
