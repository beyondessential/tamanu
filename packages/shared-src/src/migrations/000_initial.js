const Sequelize = require('sequelize');

const models = [
  require('./000_initial/referenceData'),
  require('./000_initial/user'),
  /*
  Note
  Patient
  PatientAllergy
  PatientCarePlan
  PatientCondition
  PatientFamilyHistory
  PatientIssue
  Encounter
  EncounterDiagnosis
  EncounterMedication
  Procedure
  Referral
  ReferralDiagnosis
  Vitals
  Triage
  ScheduledVaccine
  AdministeredVaccine
  Program
  ProgramDataElement
  Survey
  SurveyScreenComponent
  SurveyResponse
  SurveyResponseAnswer
  LabRequest
  LabTest
  LabTestType
  ImagingRequest
  ReportRequest
  PatientCommunication
  Setting
  SyncMetadata
  */
];

const BASE_FIELDS = {
  id: {
    type: Sequelize.STRING,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  }
};

const BASE_OPTIONS = {
  underscored: true,
};
  
module.exports = {
  up: async (query) => {
    for (const t of models) {
      await query.createTable(t.name, {
        ...BASE_FIELDS,
        ...t.fields,
        // }, {
        // ...BASE_OPTIONS,
        // ...(t.options || {}),
      });
    }
  },
  down: async (query) => {
    const reversed = [...models].reverse();
    for (const t of reversed) {
      await query.dropTable(t.name);
    }
  },
};
