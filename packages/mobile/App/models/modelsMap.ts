import { ReferenceData } from './ReferenceData';
import { Patient } from './Patient';
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
import { BaseModel } from './BaseModel';
import { ReferralForm } from './ReferralForm';
import { ReferralAnswer } from './ReferralAnswer';
import { ReferralQuestion } from './ReferralQuestion';

export const MODELS_ARRAY: typeof BaseModel[] = [
  ReferenceData,
  Patient,
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
  ReferralAnswer,
  ReferralForm,
  ReferralQuestion,
];

export const MODELS_MAP = {
  ReferenceData,
  Patient,
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
  ReferralAnswer,
  ReferralForm,
  ReferralQuestion,
};
