export const base = [
  { verb: 'read', noun: 'User' },
  { verb: 'list', noun: 'User' },
];

export const reception = base;

export const practitioner = [
  ...base,
  { verb: 'list', noun: 'ReferenceData' },
  { verb: 'read', noun: 'ReferenceData' },

  { verb: 'read', noun: 'Patient' },
  { verb: 'create', noun: 'Patient' },
  { verb: 'write', noun: 'Patient' },
  { verb: 'list', noun: 'Patient' },

  { verb: 'list', noun: 'ImagingRequest' },
  { verb: 'read', noun: 'ImagingRequest' },
  { verb: 'write', noun: 'ImagingRequest' },
  { verb: 'create', noun: 'ImagingRequest' },

  { verb: 'list', noun: 'LabRequest' },
  { verb: 'read', noun: 'LabRequest' },
  { verb: 'write', noun: 'LabRequest' },
  { verb: 'create', noun: 'LabRequest' },

  { verb: 'write', noun: 'LabRequestStatus' },
  { verb: 'write', noun: 'LabTestResult' },

  { verb: 'list', noun: 'LabRequestLog' },
  { verb: 'read', noun: 'LabRequestLog' },
  { verb: 'write', noun: 'LabRequestLog' },
  { verb: 'create', noun: 'LabRequestLog' },

  { verb: 'list', noun: 'LabTest' },
  { verb: 'read', noun: 'LabTest' },
  { verb: 'write', noun: 'LabTest' },
  { verb: 'create', noun: 'LabTest' },

  { verb: 'list', noun: 'LabTestType' },
  { verb: 'read', noun: 'LabTestType' },

  { verb: 'list', noun: 'LabTestPanel' },
  { verb: 'read', noun: 'LabTestPanel' },

  { verb: 'read', noun: 'Encounter' },
  { verb: 'list', noun: 'Encounter' },
  { verb: 'create', noun: 'Encounter' },
  { verb: 'write', noun: 'Encounter' },

  { verb: 'read', noun: 'Procedure' },
  { verb: 'list', noun: 'Procedure' },
  { verb: 'create', noun: 'Procedure' },
  { verb: 'write', noun: 'Procedure' },

  { verb: 'read', noun: 'Discharge' },
  { verb: 'list', noun: 'Discharge' },
  { verb: 'create', noun: 'Discharge' },
  { verb: 'write', noun: 'Discharge' },

  { verb: 'read', noun: 'Triage' },
  { verb: 'list', noun: 'Triage' },
  { verb: 'create', noun: 'Triage' },
  { verb: 'write', noun: 'Triage' },

  { verb: 'list', noun: 'Vitals' },
  { verb: 'read', noun: 'Vitals' },
  { verb: 'create', noun: 'Vitals' },
  { verb: 'write', noun: 'Vitals' },

  { verb: 'read', noun: 'EncounterDiagnosis' },
  { verb: 'write', noun: 'EncounterDiagnosis' },
  { verb: 'create', noun: 'EncounterDiagnosis' },
  { verb: 'list', noun: 'EncounterDiagnosis' },

  { verb: 'read', noun: 'EncounterMedication' },
  { verb: 'write', noun: 'EncounterMedication' },
  { verb: 'create', noun: 'EncounterMedication' },
  { verb: 'list', noun: 'EncounterMedication' },

  { verb: 'list', noun: 'Program' },
  { verb: 'read', noun: 'Program' },
  { verb: 'create', noun: 'Program' },
  { verb: 'write', noun: 'Program' },

  { verb: 'list', noun: 'Survey' },
  { verb: 'read', noun: 'Survey' },
  { verb: 'create', noun: 'Survey' },
  { verb: 'write', noun: 'Survey' },
  { verb: 'submit', noun: 'Survey' },

  { verb: 'create', noun: 'SurveyResponse' },
  { verb: 'list', noun: 'SurveyResponse' },
  { verb: 'read', noun: 'SurveyResponse' },
  { verb: 'write', noun: 'SurveyResponse' },

  { verb: 'list', noun: 'Referral' },
  { verb: 'read', noun: 'Referral' },
  { verb: 'write', noun: 'Referral' },
  { verb: 'create', noun: 'Referral' },

  { verb: 'list', noun: 'PatientIssue' },
  { verb: 'read', noun: 'PatientIssue' },
  { verb: 'write', noun: 'PatientIssue' },
  { verb: 'create', noun: 'PatientIssue' },

  { verb: 'list', noun: 'PatientFamilyHistory' },
  { verb: 'read', noun: 'PatientFamilyHistory' },
  { verb: 'write', noun: 'PatientFamilyHistory' },
  { verb: 'create', noun: 'PatientFamilyHistory' },

  { verb: 'list', noun: 'PatientAllergy' },
  { verb: 'read', noun: 'PatientAllergy' },
  { verb: 'write', noun: 'PatientAllergy' },
  { verb: 'create', noun: 'PatientAllergy' },

  { verb: 'list', noun: 'PatientCondition' },
  { verb: 'read', noun: 'PatientCondition' },
  { verb: 'write', noun: 'PatientCondition' },
  { verb: 'create', noun: 'PatientCondition' },

  { verb: 'list', noun: 'ReportRequest' },
  { verb: 'read', noun: 'ReportRequest' },
  { verb: 'write', noun: 'ReportRequest' },
  { verb: 'create', noun: 'ReportRequest' },

  { verb: 'list', noun: 'ReportDefinition' },
  { verb: 'read', noun: 'ReportDefinition' },
  { verb: 'write', noun: 'ReportDefinition' },
  { verb: 'create', noun: 'ReportDefinition' },

  { verb: 'list', noun: 'ReportDefinitionVersion' },
  { verb: 'read', noun: 'ReportDefinitionVersion' },
  { verb: 'write', noun: 'ReportDefinitionVersion' },
  { verb: 'create', noun: 'ReportDefinitionVersion' },

  { verb: 'list', noun: 'PatientCarePlan' },
  { verb: 'read', noun: 'PatientCarePlan' },
  { verb: 'write', noun: 'PatientCarePlan' },
  { verb: 'create', noun: 'PatientCarePlan' },

  { verb: 'read', noun: 'Setting' },
  { verb: 'list', noun: 'Setting' },

  { verb: 'list', noun: 'PatientVaccine' },
  { verb: 'read', noun: 'PatientVaccine' },
  { verb: 'create', noun: 'PatientVaccine' },
  { verb: 'write', noun: 'PatientVaccine' },

  { verb: 'list', noun: 'Facility' },
  { verb: 'read', noun: 'Facility' },
  { verb: 'create', noun: 'Facility' },
  { verb: 'write', noun: 'Facility' },

  { verb: 'list', noun: 'Department' },
  { verb: 'read', noun: 'Department' },
  { verb: 'create', noun: 'Department' },
  { verb: 'write', noun: 'Department' },

  { verb: 'list', noun: 'Location' },
  { verb: 'read', noun: 'Location' },
  { verb: 'create', noun: 'Location' },
  { verb: 'write', noun: 'Location' },

  { verb: 'list', noun: 'LocationGroup' },
  { verb: 'read', noun: 'LocationGroup' },
  { verb: 'create', noun: 'LocationGroup' },
  { verb: 'write', noun: 'LocationGroup' },

  { verb: 'list', noun: 'Attachment' },
  { verb: 'read', noun: 'Attachment' },

  { verb: 'list', noun: 'DocumentMetadata' },
  { verb: 'read', noun: 'DocumentMetadata' },
  { verb: 'write', noun: 'DocumentMetadata' },
  { verb: 'create', noun: 'DocumentMetadata' },

  { verb: 'list', noun: 'Appointment' },
  { verb: 'read', noun: 'Appointment' },
  { verb: 'write', noun: 'Appointment' },
  { verb: 'create', noun: 'Appointment' },

  { verb: 'list', noun: 'Invoice' },
  { verb: 'read', noun: 'Invoice' },
  { verb: 'write', noun: 'Invoice' },
  { verb: 'create', noun: 'Invoice' },

  { verb: 'list', noun: 'InvoiceLineItem' },
  { verb: 'read', noun: 'InvoiceLineItem' },
  { verb: 'write', noun: 'InvoiceLineItem' },
  { verb: 'create', noun: 'InvoiceLineItem' },

  { verb: 'list', noun: 'InvoiceLineType' },
  { verb: 'read', noun: 'InvoiceLineType' },
  { verb: 'write', noun: 'InvoiceLineType' },
  { verb: 'create', noun: 'InvoiceLineType' },

  { verb: 'list', noun: 'InvoicePriceChangeItem' },
  { verb: 'read', noun: 'InvoicePriceChangeItem' },
  { verb: 'write', noun: 'InvoicePriceChangeItem' },
  { verb: 'create', noun: 'InvoicePriceChangeItem' },

  { verb: 'list', noun: 'InvoicePriceChangeType' },
  { verb: 'read', noun: 'InvoicePriceChangeType' },
  { verb: 'write', noun: 'InvoicePriceChangeType' },
  { verb: 'create', noun: 'InvoicePriceChangeType' },

  { verb: 'create', noun: 'CertificateNotification' },

  { verb: 'read', noun: 'PatientDeath' },
  { verb: 'create', noun: 'PatientDeath' },

  { verb: 'list', noun: 'PatientSecondaryId' },
  { verb: 'read', noun: 'PatientSecondaryId' },
  { verb: 'write', noun: 'PatientSecondaryId' },
  { verb: 'create', noun: 'PatientSecondaryId' },

  { verb: 'run', noun: 'StaticReport' },

  { verb: 'write', noun: 'OtherPractitionerEncounterNote' },
  { verb: 'write', noun: 'TreatmentPlanNote' },

  { verb: 'read', noun: 'EncounterNote' },
  { verb: 'list', noun: 'EncounterNote' },
  { verb: 'create', noun: 'EncounterNote' },
  { verb: 'write', noun: 'EncounterNote' },

  { verb: 'read', noun: 'ProgramRegistry' },
  { verb: 'list', noun: 'ProgramRegistry' },

  { verb: 'read', noun: 'ProgramRegistryClinicalStatus' },
  { verb: 'list', noun: 'ProgramRegistryClinicalStatus' },

  { verb: 'read', noun: 'ProgramRegistryCondition' },
  { verb: 'list', noun: 'ProgramRegistryCondition' },

  { verb: 'read', noun: 'PatientProgramRegistration' },
  { verb: 'list', noun: 'PatientProgramRegistration' },
  { verb: 'create', noun: 'PatientProgramRegistration' },
  { verb: 'write', noun: 'PatientProgramRegistration' },

  { verb: 'read', noun: 'PatientProgramRegistrationCondition' },
  { verb: 'list', noun: 'PatientProgramRegistrationCondition' },
  { verb: 'create', noun: 'PatientProgramRegistrationCondition' },
  { verb: 'write', noun: 'PatientProgramRegistrationCondition' },
  { verb: 'delete', noun: 'PatientProgramRegistrationCondition' },
];

// "Manage all" is a special case in CASL for the admin to grant everything
export const admin = [{ verb: 'manage', noun: 'all' }];
