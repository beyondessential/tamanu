import type { ID } from './ID';
import type { IUser } from './IUser';
import type { ISurveyResponseAnswer } from './ISurveyResponse';

export interface IVitalLog {
  id: ID;

  date: string;
  previousValue: string;
  newValue: string;
  reasonForChange: string;

  recordedBy: IUser;
  recordedById: string;

  answer: ISurveyResponseAnswer;
  answerId: string;
}
