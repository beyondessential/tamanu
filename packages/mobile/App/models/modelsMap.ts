import { TranslatedString } from './TranslatedString';
import { ReferenceData } from './ReferenceData';
import { ReferenceDrug } from './ReferenceDrug';
import { ReferenceDataRelation } from './ReferenceDataRelation';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientFieldValue } from './PatientFieldValue';
import { PatientFieldDefinition } from './PatientFieldDefinition';
import { PatientFieldDefinitionCategory } from './PatientFieldDefinitionCategory';
import { PatientIssue } from './PatientIssue';
import { PatientSecondaryId } from './PatientSecondaryId';
import { PatientContact } from './PatientContact';
import { PatientAllergy } from './PatientAllergy';
import { User } from './User';
import { Encounter } from './Encounter';
import { EncounterHistory } from './EncounterHistory';
import { Program } from './Program';
import { ProgramRegistry } from './ProgramRegistry';
import { ProgramRegistryCondition } from './ProgramRegistryCondition';
import { PatientProgramRegistration } from './PatientProgramRegistration';
import { ProgramRegistryConditionCategory } from './ProgramRegistryConditionCategory';
import { PatientProgramRegistrationCondition } from './PatientProgramRegistrationCondition';
import { ProgramRegistryClinicalStatus } from './ProgramRegistryClinicalStatus';
import { ProgramDataElement } from './ProgramDataElement';
import { Survey } from './Survey';
import { SurveyScreenComponent } from './SurveyScreenComponent';
import { SurveyResponse } from './SurveyResponse';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { Vitals } from './Vitals';
import { Diagnosis } from './Diagnosis';
import { ScheduledVaccine } from './ScheduledVaccine';
import { AdministeredVaccine } from './AdministeredVaccine';
import { Referral } from './Referral';
import { Prescription } from './Prescription';
import { Attachment } from './Attachment';
import { Facility } from './Facility';
import { Department } from './Department';
import { Location } from './Location';
import { LocationGroup } from './LocationGroup';
import { LabRequest } from './LabRequest';
import { LabTest } from './LabTest';
import { LabTestType } from './LabTestType';
import { LabTestPanelRequest } from './LabTestPanelRequest';
import { LabTestPanel } from './LabTestPanel';
import { LocalSystemFact } from './LocalSystemFact';
import { PatientFacility } from './PatientFacility';
import { Setting } from './Setting';
import { Note } from './Note';
import { VitalLog } from './VitalLog';
import { UserFacility } from './UserFacility';
import { EncounterPrescription } from './EncounterPrescription';
import { PatientOngoingPrescription } from './PatientOngoingPrescription';
import { MedicationAdministrationRecord } from './MedicationAdministrationRecord';
import { Task } from './Task';
import { TaskDesignation } from './TaskDesignation';

export const MODELS_MAP = {
  ReferenceData,
  ReferenceDrug,
  TranslatedString,
  Patient,
  PatientAdditionalData,
  PatientFieldDefinitionCategory,
  PatientFieldDefinition,
  PatientFieldValue,
  PatientIssue,
  PatientSecondaryId,
  PatientContact,
  PatientAllergy,
  User,
  Encounter,
  EncounterHistory,
  Program,
  ProgramRegistry,
  ProgramRegistryCondition,
  ProgramRegistryClinicalStatus,
  ProgramRegistryConditionCategory,
  PatientProgramRegistration,
  PatientProgramRegistrationCondition,
  ReferenceDataRelation,
  ProgramDataElement,
  Survey,
  SurveyScreenComponent,
  SurveyResponse,
  SurveyResponseAnswer,
  VitalLog,
  Vitals,
  Diagnosis,
  ScheduledVaccine,
  AdministeredVaccine,
  EncounterPrescription,
  Prescription,
  PatientOngoingPrescription,
  MedicationAdministrationRecord,
  Referral,
  Attachment,
  Facility,
  Department,
  Location,
  LocationGroup,
  LabRequest,
  LabTest,
  LabTestType,
  LabTestPanel,
  LabTestPanelRequest,
  LocalSystemFact,
  PatientFacility,
  Setting,
  Note,
  UserFacility,
  Task,
  TaskDesignation,
};

type AllValuesOfObject<T extends object> = Array<T[keyof T]>;
export type ArrayOfModels = AllValuesOfObject<typeof MODELS_MAP>;
export const MODELS_ARRAY: ArrayOfModels = Object.values(MODELS_MAP);
