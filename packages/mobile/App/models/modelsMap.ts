import { AdministeredVaccine } from './AdministeredVaccine';
import { Attachment } from './Attachment';
import { BaseModel } from './BaseModel';
import { Department } from './Department';
import { Diagnosis } from './Diagnosis';
import { Encounter } from './Encounter';
import { EncounterHistory } from './EncounterHistory';
import { Facility } from './Facility';
import { LabRequest } from './LabRequest';
import { LabTest } from './LabTest';
import { LabTestPanel } from './LabTestPanel';
import { LabTestPanelRequest } from './LabTestPanelRequest';
import { LabTestType } from './LabTestType';
import { LegacyNoteItem } from './LegacyNoteItem';
import { LegacyNotePage } from './LegacyNotePage';
import { LocalSystemFact } from './LocalSystemFact';
import { Location } from './Location';
import { LocationGroup } from './LocationGroup';
import { Medication } from './Medication';
import { Note } from './Note';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientFacility } from './PatientFacility';
import { PatientFieldDefinition } from './PatientFieldDefinition';
import { PatientFieldDefinitionCategory } from './PatientFieldDefinitionCategory';
import { PatientFieldValue } from './PatientFieldValue';
import { PatientIssue } from './PatientIssue';
import { PatientSecondaryId } from './PatientSecondaryId';
import { Program } from './Program';
import { ProgramDataElement } from './ProgramDataElement';
import { ReferenceData } from './ReferenceData';
import { Referral } from './Referral';
import { ScheduledVaccine } from './ScheduledVaccine';
import { Setting } from './Setting';
import { Survey } from './Survey';
import { SurveyResponse } from './SurveyResponse';
import { SurveyResponseAnswer } from './SurveyResponseAnswer';
import { SurveyScreenComponent } from './SurveyScreenComponent';
import { User } from './User';
import { VitalLog } from './VitalLog';
import { Vitals } from './Vitals';

export const MODELS_MAP = {
  ReferenceData,
  Patient,
  PatientAdditionalData,
  PatientFieldDefinitionCategory,
  PatientFieldDefinition,
  PatientFieldValue,
  PatientIssue,
  PatientSecondaryId,
  User,
  Encounter,
  EncounterHistory,
  Program,
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
  Medication,
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
  LegacyNotePage,
  LegacyNoteItem,
  Note,
};
export const MODELS_ARRAY: typeof BaseModel[] = Object.values(MODELS_MAP);
