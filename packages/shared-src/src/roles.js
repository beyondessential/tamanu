export const anonymous = () => {};

export const base = (user, allow, forbid) => {
  anonymous(user, allow, forbid);

  allow('read', 'User');
  allow('list', 'User');
  allow('write', 'User', { id: user.id });
};

export const reception = (user, allow, forbid) => {
  base(user, allow, forbid);
};

export const practitioner = (user, allow, forbid) => {
  base(user, allow, forbid);

  allow('list', 'ReferenceData');
  allow('read', 'ReferenceData');

  allow('read', 'Patient');
  allow('create', 'Patient');
  allow('write', 'Patient');
  allow('list', 'Patient');

  allow('list', 'ImagingRequest');
  allow('read', 'ImagingRequest');
  allow('write', 'ImagingRequest');
  allow('create', 'ImagingRequest');

  allow('list', 'LabRequest');
  allow('read', 'LabRequest');
  allow('write', 'LabRequest');
  allow('create', 'LabRequest');

  allow('list', 'LabTest');
  allow('read', 'LabTest');
  allow('write', 'LabTest');
  allow('create', 'LabTest');

  allow('read', 'Encounter');
  allow('list', 'Encounter');
  allow('create', 'Encounter');
  allow('write', 'Encounter');

  allow('read', 'Procedure');
  allow('list', 'Procedure');
  allow('create', 'Procedure');
  allow('write', 'Procedure');

  allow('read', 'Discharge');
  allow('list', 'Discharge');
  allow('create', 'Discharge');
  allow('write', 'Discharge');

  allow('read', 'Triage');
  allow('list', 'Triage');
  allow('create', 'Triage');
  allow('write', 'Triage');

  allow('list', 'Vitals');
  allow('read', 'Vitals');
  allow('create', 'Vitals');

  allow('read', 'EncounterDiagnosis');
  allow('write', 'EncounterDiagnosis');
  allow('create', 'EncounterDiagnosis');
  allow('list', 'EncounterDiagnosis');

  allow('read', 'EncounterMedication');
  allow('write', 'EncounterMedication');
  allow('create', 'EncounterMedication');
  allow('list', 'EncounterMedication');

  allow('list', 'Program');
  allow('read', 'Program');
  allow('create', 'Program');
  allow('write', 'Program');

  allow('list', 'Survey');
  allow('read', 'Survey');
  allow('create', 'Survey');
  allow('write', 'Survey');

  allow('create', 'SurveyResponse');
  allow('list', 'SurveyResponse');
  allow('read', 'SurveyResponse');
  allow('write', 'SurveyResponse');

  allow('list', 'Referral');
  allow('read', 'Referral');
  allow('write', 'Referral');
  allow('create', 'Referral');

  allow('list', 'Immunisation');
  allow('read', 'Immunisation');
  allow('write', 'Immunisation');
  allow('create', 'Immunisation');

  allow('list', 'PatientIssue');
  allow('read', 'PatientIssue');
  allow('write', 'PatientIssue');
  allow('create', 'PatientIssue');

  allow('list', 'PatientFamilyHistory');
  allow('read', 'PatientFamilyHistory');
  allow('write', 'PatientFamilyHistory');
  allow('create', 'PatientFamilyHistory');

  allow('list', 'PatientAdditionalData');
  allow('read', 'PatientAdditionalData');
  allow('write', 'PatientAdditionalData');
  allow('create', 'PatientAdditionalData');

  allow('list', 'PatientAllergy');
  allow('read', 'PatientAllergy');
  allow('write', 'PatientAllergy');
  allow('create', 'PatientAllergy');

  allow('list', 'PatientCondition');
  allow('read', 'PatientCondition');
  allow('write', 'PatientCondition');
  allow('create', 'PatientCondition');

  allow('list', 'ReportRequest');
  allow('read', 'ReportRequest');
  allow('write', 'ReportRequest');
  allow('create', 'ReportRequest');

  allow('list', 'PatientCarePlan');
  allow('read', 'PatientCarePlan');
  allow('write', 'PatientCarePlan');
  allow('create', 'PatientCarePlan');

  allow('read', 'Setting');
  allow('list', 'Setting');

  allow('list', 'PatientVaccine');
  allow('read', 'PatientVaccine');
  allow('create', 'PatientVaccine');
  allow('write', 'PatientVaccine');

  allow('list', 'Location');
  allow('read', 'Location');
  allow('create', 'Location');
  allow('write', 'Location');
};

export const admin = (user, allow, forbid) => {
  practitioner(user, allow, forbid);

  allow('create', 'User');
  allow('write', 'User');

  allow('write', 'ReferenceData');
  allow('create', 'ReferenceData');

  allow('write', 'Setting');
  allow('create', 'Setting');
};
