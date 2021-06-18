import { ReferenceData } from './ReferenceData';
import { Patient } from './Patient';
import { PatientAdditionalData } from './PatientAdditionalData';
import { PatientIssue } from './PatientIssue';
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
import { BaseModel } from './BaseModel';
import { LabRequest } from './LabRequest';
import { LabTest } from './LabTest';
import { LabTestType } from './LabTestType';

export const MODELS_ARRAY: typeof BaseModel[] = [
  ReferenceData,
  Patient,
  PatientAdditionalData,
  PatientIssue,
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
  LabRequest,
  LabTest,
  LabTestType,
];

export const MODELS_MAP = {
  ReferenceData,
  Patient,
  PatientAdditionalData,
  PatientIssue,
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
  LabRequest,
  LabTest,
  LabTestType,
};
