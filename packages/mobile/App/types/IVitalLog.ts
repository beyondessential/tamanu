import { ID } from './ID';
import { IUser } from './IUser';
import { ISurveyResponseAnswer } from './ISurveyResponse';

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
