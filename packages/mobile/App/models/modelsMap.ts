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

export const MODELS_ARRAY: BaseModel[] = [
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
  Referral,
  Medication,
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
  Referral,
  Medication,
};
