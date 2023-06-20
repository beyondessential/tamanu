import { ReferenceData } from './ReferenceData';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientIssue } from './PatientIssue';
import { PatientSecondaryId } from './PatientSecondaryId';
import { User } from './User';
import { Encounter } from './Encounter';
import { Program } from './Program';
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
import { Medication } from './Medication';
import { Attachment } from './Attachment';
import { Facility } from './Facility';
import { Department } from './Department';
import { Location } from './Location';
import { LocationGroup } from './LocationGroup';
import { BaseModel } from './BaseModel';
import { LabRequest } from './LabRequest';
import { LabTest } from './LabTest';
import { LabTestType } from './LabTestType';
import { LabTestPanelRequest } from './LabTestPanelRequest';
import { LabTestPanel } from './LabTestPanel';
import { LocalSystemFact } from './LocalSystemFact';
import { PatientFacility } from './PatientFacility';
import { Setting } from './Setting';
import { NotePage } from './NotePage';
import { NoteItem } from './NoteItem';

export const MODELS_MAP = {
  ReferenceData,
  Patient,
  PatientAdditionalData,
  PatientIssue,
  PatientSecondaryId,
  User,
  Encounter,
  Program,
  ProgramDataElement,
  Survey,
  SurveyScreenComponent,
  SurveyResponse,
  SurveyResponseAnswer,
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
  NotePage,
  NoteItem,
};
export const MODELS_ARRAY: typeof BaseModel[] = Object.values(MODELS_MAP);
